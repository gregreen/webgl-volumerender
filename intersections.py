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


def ray_endpoints(r, h, x0, dx):
    '''
    Calculate the intersections of a ray with a cylinder defined by a radius
    r and height h (extending to both z = +-h).
    '''

    # Intersection with the top cap
    s_top = plane_intersection(np.array([0., 0., 1.]), h, x0, dx)

    if s_top > 0.:
        x_top = x0 + s_top * dx
        if x_top[0]**2 + x_top[1]**2 > r**2:
            s_top = -1.

    # Intersection with the bottom cap
    s_bottom = plane_intersection(np.array([0., 0., 1.]), -h, x0, dx)

    if s_bottom > 0.:
        x_bottom = x0 + s_bottom * dx
        if x_bottom[0]**2 + x_bottom[1]**2 > r**2:
            s_bottom = -1.

    # Intersection with the cylinder's circular edge
    s_plus, s_minus = cylinder_intersections(r, x0, dx)

    if s_plus > 0.:
        x_plus = x0 + s_plus * dx
        if (x_plus[2] < -h) or (x_plus[2] > h):
            s_plus = -1.

    if s_minus > 0.:
        x_minus = x0 + s_minus * dx
        if (x_minus[2] < -h) or (x_minus[2] > h):
            s_minus = -1.

    s = np.array([s_top, s_bottom, s_minus, s_plus])

    return s



def main():
    #passed = test_plane_intersection(10)
    #passed = test_cylinder_intersections(10)

    r = 1.0
    h = 0.5
    x0 = np.array([-1.5, 0., 0.])
    dx = np.array([ 1., 0., 0.1])

    s_endpoints = ray_endpoints(r, h, x0, dx)

    print s_endpoints

    return 0

if __name__ == '__main__':
    main()
