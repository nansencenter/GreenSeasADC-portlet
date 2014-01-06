/*
 * Copyright (c) 2010 The University of Reading
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the University of Reading, nor the names of the
 *    authors or contributors may be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR  CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

package uk.ac.rdg.resc.edal.coverage.grid.impl;

import java.util.AbstractList;
import java.util.Collections;
import java.util.List;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import uk.ac.rdg.resc.edal.coverage.domain.Domain;
import uk.ac.rdg.resc.edal.coverage.grid.GridCoordinates;
import uk.ac.rdg.resc.edal.coverage.grid.HorizontalGrid;
import uk.ac.rdg.resc.edal.geometry.HorizontalPosition;
import uk.ac.rdg.resc.edal.util.CollectionUtils;
import uk.ac.rdg.resc.edal.util.Utils;

/**
 * Abstract superclass that partially implements a two-dimensional
 * {@link HorizontalGrid}.
 * @author Jon
 */
public abstract class AbstractHorizontalGrid extends AbstractGrid implements HorizontalGrid
{
    private final CoordinateReferenceSystem crs;

    private final class DomainObjectList extends AbstractList<HorizontalPosition>
    {
        private final int iAxisSize = AbstractHorizontalGrid.this.getGridExtent().getSpan(0);
        private final int jAxisSize = AbstractHorizontalGrid.this.getGridExtent().getSpan(1);
        private final long size = AbstractHorizontalGrid.this.size();
        
        @Override
        public HorizontalPosition get(int index) {
            if (index < 0) {
                throw new IndexOutOfBoundsException(index + " is out of bounds");
            }
            int xi = index % this.iAxisSize;
            int yi = index / this.iAxisSize;
            if (yi >= this.jAxisSize) {
                throw new IndexOutOfBoundsException(index + " is out of bounds");
            }
            // We know that the coordinates are valid within the grid so there's
            // no need to check the bounds again
            HorizontalPosition pos = AbstractHorizontalGrid.this.transformCoordinatesNoBoundsCheck(xi, yi);
            if (pos == null) {
                throw new IndexOutOfBoundsException("Index " + index + " is out of bounds");
            }
            return pos;
        }

        @Override
        public int size() {
            // By the contract of java.util.Collection
            return this.size > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int)size;
        }
    };

    protected AbstractHorizontalGrid(CoordinateReferenceSystem crs)
    {
        this.crs = crs;
    }

    @Override
    public final CoordinateReferenceSystem getCoordinateReferenceSystem() {
        return this.crs;
    }

    @Override
    public HorizontalPosition transformCoordinates(GridCoordinates coords) {
        if (coords.getDimension() != 2) {
            throw new IllegalArgumentException("GridCoordinates must be 2D");
        }
        return transformCoordinates(coords.getCoordinateValue(0), coords.getCoordinateValue(1));
    }

    @Override
    public HorizontalPosition transformCoordinates(int i, int j) {
        GridEnvelopeImpl gridEnv = GridEnvelopeImpl.convert(this.getGridExtent());
        if (!gridEnv.contains(i, j)) return null;
        return this.transformCoordinatesNoBoundsCheck(i, j);
    }

    /** Transforms grid coordinates into a HorizontalPosition without first
     * checking that the grid coordinates are valid for this grid.  Use only
     * when you know in advance that the coordinates are valid. */
    protected abstract HorizontalPosition transformCoordinatesNoBoundsCheck(int i, int j);

    /**
     * {@inheritDoc}
     * <p>This implementation uses {@link Utils#transformDomain(uk.ac.rdg.resc.edal.coverage.domain.Domain, org.opengis.referencing.crs.CoordinateReferenceSystem)
     * Utils.transformDomain()} to convert the domain's points to this grid's
     * CRS in one operation, then calls {@link #findNearestGridPoint(double, double)}
     * for each resulting point.</p>
     */
    @Override
    public List<GridCoordinates> findNearestGridPoints(Domain<HorizontalPosition> domain) {
        // Translate all points into this coordinate reference system
        List<HorizontalPosition> positions = Utils.transformDomain(domain, this.crs);
        // Now translate all of these to grid coordinates
        List<GridCoordinates> gridCoords = CollectionUtils.newArrayList(positions.size());
        for (HorizontalPosition pos : positions) {
            gridCoords.add(findNearestGridPoint(pos.getX(), pos.getY()));
        }
        return Collections.unmodifiableList(gridCoords);
    }
    
    /**
     * {@inheritDoc}
     * <p>This implementation uses {@link Utils#transformPosition(uk.ac.rdg.resc.edal.geometry.HorizontalPosition, org.opengis.referencing.crs.CoordinateReferenceSystem) 
     * Utils.transformPosition()} to convert the point to this grid's
     * CRS, then calls {@link #findNearestGridPoint(double, double)}.</p>
     */
    @Override
    public GridCoordinates findNearestGridPoint(HorizontalPosition pos) {
        HorizontalPosition newPos = Utils.transformPosition(pos, this.crs);
        return this.findNearestGridPoint(newPos.getX(), newPos.getY());
    }
    
    /**
     * Finds the nearest (two-dimensional) grid point to the given position,
     * which is expressed in the {@link #getCoordinateReferenceSystem() CRS
     * of this grid}.
     * @param x The x coordinate within the grid's CRS
     * @param y The y coordinate within the grid's CRS
     * @return the nearest grid point to the given position, or null if the
     * position is outside the {@link BoundingBox bounding box} of the grid.
     */
    protected abstract GridCoordinates findNearestGridPoint(double x, double y);

    /**
     * Returns an unmodifiable List of horizontal positions derived from the two axes.
     * The x axis is considered to vary fastest, so the first point in the list
     * represents the grid point [x0,y0], the second point is [x1,y0] and so on.
     * Returns a new List on each invocation.  Changing this HorizontalGrid while
     * the returned list is in use may have undefined results.
     * @return
     */
    @Override
    public final List<HorizontalPosition> getDomainObjects() {
        return new DomainObjectList();
    }

}
