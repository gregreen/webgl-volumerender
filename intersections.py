#!/usr/env python

import numpy as np

def plane_intersection(a, c, x0, dx, eps=1.e-10):
    '''
    Calculate distance, s, at which the ray
        $\vec{x}_0 + s \cdot \vec{\delta x}$
    intersects the plane
        $\vec{a} \cdot \vec{r} = c$.
    '''

    denom = np.dot(a, dx)

    if denom < eps:
        return np.nan

    return (c - np.dot(a, x0)) / denom

def test_plane_intersection(n, eps=1.e-10):
    # Define n random planes
    a = np.random.random((n,3))
    c = np.random.random(n)

    # Define n random rays
    x0 = np.random.random((n,3))
    dx = np.random.random((n,3))

    # Calculate intersections
    s = np.empty(n, dtype='f8')

    for k in xrange(n):
        s[k] = plane_intersection(a[k], c[k], x0[k], dx[k])

    # Verify intersections
    r = x0 + s[:,None] * dx
    delta = np.einsum('jk,jk->j', a, r) - c
    good_idx = (delta < eps)
    good_idx |= np.isnan(s)

    print ''
    print 'Passed       Dc           s   '
    print '------------------------------'
    #print 'True    -0.00000e-15  -0.78462'
    for k in xrange(n):
        print '{}    {: > 10.3g}  {: > 10.5f}'.format(good_idx[k], delta[k], s[k])
    print ''

    return np.all(good_idx)


def cylinder_intersections(r, x0, dx):
    '''
    Calculate distance, s, at which the ray
        $\vec{x}_0 + s \cdot \vec{\delta x}$
    intersects the cylinder (w/o caps)
        $x^2 + y^2 = r^2$.
    '''

    a = dx[0]**2 + dx[1]**2
    b = 2. * (x0[0]*dx[0] + x0[1]*dx[1])
    c = x0[0]**2 + x0[1]**2 - r**2

    discriminant = b**2 - 4.*a*c

    if discriminant < 0.:
        return (np.nan, np.nan)

    k = 1. / (2. * a)
    disc_term = k * np.sqrt(discriminant)
    b_term = -k * b

    return (b_term + disc_term, b_term - disc_term)

def test_cylinder_intersections(n, eps=1.e-10):
    # Define n random cylinders
    xi = np.random.random(n)

    # Define n random rays
    x0 = np.random.random((n,3))
    dx = np.random.random((n,3))

    # Calculate intersections
    s = np.empty((n,2), dtype='f8')

    for k in xrange(n):
        s[k] = cylinder_intersections(xi[k], x0[k], dx[k])

    # Verify intersections
    r = x0[:,:,None] + s[:,None,:] * dx[:,:,None]   # (sample, axis, intersection)
    delta = r[:,0,:]**2 + r[:,1,:]**2 - xi[:,None]**2
    good_idx = (delta < eps)
    good_idx |= np.isnan(s)

    print ''
    print 'Passed       Dr^2         s   '
    print '------------------------------'
    for k in xrange(n):
        print '{}    {: > 10.3g}  {: > 10.5f}'.format(good_idx[k,0], delta[k,0], s[k,0])
        print '{}    {: > 10.3g}  {: > 10.5f}'.format(good_idx[k,1], delta[k,1], s[k,1])
        print ''
    print ''

    return np.all(good_idx)

def main():
    passed = test_plane_intersection(10)
    passed = test_cylinder_intersections(10)

    return 0

if __name__ == '__main__':
    main()
