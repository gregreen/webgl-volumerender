#!/usr/env python

import numpy as np
from PIL import Image

import h5py
import healpy as hp

import os, os.path

def downsample_by_2(img):
    return 0.25 * (
        img[:-1:2, :-1:2]
      + img[1::2,  :-1:2]
      + img[:-1:2, 1::2]
      + img[1::2,  1::2]
    )

def main():
    try:
        dust_path = os.environ['DUST_PATH']
    except KeyError:
        print "Set the environement variable 'DUST_PATH'"
        print 'to the folder containing the dust map.'
        return 1

    print ''
    print 'Looking for dust map in folder: "{}"'.format(dust_path)
    print "If this isn't right, set the environment"
    print "variable 'DUST_PATH' to the correct path."
    print ''

    # Open the file and extract pixel information and
    # median reddening in the far limit
    f = h5py.File(os.path.join(dust_path, 'dust-map-3d.h5'), 'r')
    pix_info = f['/pixel_info'][:]
    EBV = f['/best_fit'][:,:]
    f.close()

    EBV[:,1:] = np.diff(EBV, axis=1)

    # Construct an empty map at the highest HEALPix
    # resolution present in the map
    nside_max = np.max(pix_info['nside'])
    n_pix = hp.pixelfunc.nside2npix(nside_max)
    n_dists = EBV.shape[1]

    arr_idx = np.empty(n_pix, dtype='i8')
    arr_idx[:] = -1

    # Fill the upsampled map
    for nside in np.unique(pix_info['nside']):
        # Get indices of all pixels at current nside level
        idx = np.nonzero(pix_info['nside'] == nside)[0]

        # Determine nested index of each selected pixel
        # in upsampled map
        mult_factor = (nside_max/nside)**2
        pix_idx_n = pix_info['healpix_index'][idx] * mult_factor

        # Write the selected pixels into the upsampled map
        for offset in range(mult_factor):
            arr_idx[pix_idx_n+offset] = idx[:]

    pix_missing = (arr_idx == -1)
    print '{:.3f}% of pixels missing.'.format(100.*float(np.sum(pix_missing))/float(pix_missing.size))

    # Determine the Cartesian projection
    x_size = 8192
    n_downsample = 1
    x_size_reduced = x_size / 2**n_downsample
    pp = np.linspace(0., 2.*np.pi, x_size+1)[:-1]
    tt = np.linspace(0., np.pi, x_size/2)
    t,p = np.meshgrid(tt,pp)
    ipix = hp.pixelfunc.ang2pix(nside_max, t, p, nest=True)

    # Rasterize the map at each distance, and pack into RGBA
    # channels of PNG images
    DM = np.linspace(4., 19., n_dists)
    dists = 10.**(DM/5.-2.)

    rgba_img = []
    channel = 0
    tex_idx = 0

    for k in xrange(n_dists):
        # Convert map to mag/kpc
        dr = dists[k]
        if k != 0:
            dr -= dists[k-1]

        print 'dr = {:.5f}'.format(dr)

        EBV_hires = (EBV[:,k]/dr)[arr_idx]
        EBV_hires[pix_missing] = 0.

        print np.percentile(EBV_hires[~pix_missing], [1., 10., 25., 50., 75., 90., 99.])

        proj_map = EBV_hires[ipix][::-1,:]
        for j in xrange(n_downsample):
            proj_map = downsample_by_2(proj_map)
        #proj_map = downsample_by_2(downsample_by_2(downsample_by_2(proj_map)))

        # import matplotlib.pyplot as plt
        # fig = plt.figure(0, figsize=(10,5), dpi=100)
        # ax = fig.add_subplot(1,1,1)
        # ax.imshow(proj_map.T, origin='lower', interpolation='nearest',
        #                  vmin=0., vmax=5.)
        # plt.show()
        # plt.close(fig)

        print proj_map.shape

        vmax = np.power(5., 1./4.)
        proj_map = np.power(proj_map, 1./4.)
        proj_map = (np.clip(proj_map.T, 0., vmax) * (255./vmax)).astype('uint8')
        #if channel == 3:
        #    proj_map[:] = 255

        # Add to appropriate image channel (R,G,B or A)
        rgba_img.append(Image.fromarray(proj_map))
        channel = (channel + 1) % 4
        if channel == 0:
            # Save image
            print 'Saving image {:d} ...'.format(tex_idx+1)
            im_merged = Image.merge('RGBA', rgba_img)
            im_merged.save('texture_{}x{}_{}.png'.format(x_size_reduced, x_size_reduced/2, tex_idx))
            rgba_img = []
            tex_idx += 1

    if len(rgba_img) != 0:
        print 'Saving image {:d} ...'.format(tex_idx+1)
        for k in range(len(rgba_img),4):
            img_tmp = 255*np.ones((x_size_reduced/2,x_size_reduced), dtype='uint8')
            rgba_img.append(Image.fromarray(img_tmp))
        im_merged = Image.merge('RGBA', rgba_img)
        im_merged.save('texture_{}x{}_{}.png'.format(x_size_reduced, x_size_reduced/2, tex_idx))

    return 0

if __name__ == '__main__':
    main()
