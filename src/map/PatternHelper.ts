/// <reference path="../../typings/Interfaces.d.ts" />
// import Interface = require('../Interface');
import Randomizer = require('../utils/Randomizer');

class DistancePoint implements DistancePoint {
  constructor(public x: number, public y: number, public distance: number) {}
}

class RectArea implements RectArea {
  constructor(public id: number, public x: number, public y: number, public w: number, public h: number) {}
}

class FreeAroundPoint implements DistancePoint {
  constructor(public x: number, public y: number, public radius: number, public distance: number) {}
  distanceTo(point: FreeAroundPoint) {
    let dx = point.x - this.x;
    let dy = point.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

class Bypass {
  public radiusLimit: number;
  public points: FreeAroundPoint[] = [];

  constructor(radiusLimit: number) {
    this.radiusLimit = radiusLimit;
    this.generateBypassShifts();
  }

  public get length(): number {
    return this.points.length;
  }

  /*
    89->.
    .012.
    .7 3.
    .654.
    .....
  */
  private generateBypassShifts(): void {
    let radiusLimit = this.radiusLimit;
    let cx: number, cy: number;

    for (let radius = 1; radius < radiusLimit; radius++) {
      // TL->TR
      cy = -radius;
      for (cx = -radius; cx <= radius; cx++) {
        this.points.push(new FreeAroundPoint(cx, cy, radius, Math.sqrt(cx * cx + cy * cy)));
      }
      // TR->BR
      cx = radius;
      for (cy = -radius + 1; cy <= radius; cy++) {
        this.points.push(new FreeAroundPoint(cx, cy, radius, Math.sqrt(cx * cx + cy * cy)));
      }
      // BR->BL
      cy = radius;
      for (cx = radius - 1; cx >= -radius; cx--) {
        this.points.push(new FreeAroundPoint(cx, cy, radius, Math.sqrt(cx * cx + cy * cy)));
      }
      // BL->TL
      cx = -radius;
      for (cy = radius - 1; cy >= -radius + 1; cy--) {
        this.points.push(new FreeAroundPoint(cx, cy, radius, Math.sqrt(cx * cx + cy * cy)));
      }
    }
  }
}

class PatternHelper {
  public static createFilled(n: number, m: number, defautValue: any): any[][] {
    let pattern = [];
    let count = 0;

    for (let i = 0; i < n; i++) {
      let col = [];
      pattern[i] = col;
      for (let j = 0; j < m; j++) {
        count++;
        col[j] = defautValue;
      }
    }
    return pattern;
  }

  public static fillUniform(pattern: number[][], chance: number, randomFunction: Function, fillValue: number): void {
    let n = pattern.length;
    let m = pattern[0].length;
    let count = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        // TODO: implement radius based border chance
        if (randomFunction() < chance) {
          count++;
          pattern[i][j] = fillValue;
        }
      }
    }
  }

  public static countNotEmptyNeighbours(pattern: number[][], x: number, y: number): number {
    let n = pattern.length;
    let m = pattern[0].length;
    let neighbourX: number, neighbourY: number;
    let outOfBound: boolean;
    let neighbourCount = 0;

    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        // skip self
        if (i !== 0 || j !== 0) {
          neighbourX = x + i;
          neighbourY = y + j;
          outOfBound = neighbourX < 0 || neighbourY < 0 || neighbourX >= n || neighbourY >= m;

          if (outOfBound || pattern[neighbourX][neighbourY] !== 0) {
            neighbourCount++;
          }
        }
      }
    }

    return neighbourCount;
  }

  // flood into fillPattern (w/o diagonal)
  public static floodFill(pattern: number[][], x: number, y: number, checkedPattern: number[][]): Point[] {
    let filledCells: Point[] = [];
    let n = pattern.length;
    let m = pattern[0].length;
    let i: number, j: number, cx: number, cy: number;

    let cellsToCheckX = [x];
    let cellsToCheckY = [y];
    let newCellsToCheckX = [];
    let newCellsToCheckY = [];

    while(cellsToCheckX.length) {
      newCellsToCheckX = [];
      newCellsToCheckY = [];

      for (i=cellsToCheckX.length - 1; i >= 0; i--) {
        cx = cellsToCheckX[i];
        cy = cellsToCheckY[i];

        if (cx >= 0 && cy >= 0 && cx < n && cy < m) {
          // if empty and was not checked before
          if (checkedPattern[cx][cy] === 0 && pattern[cx][cy] === 0) {
            // mark as flooded
            checkedPattern[cx][cy] = 1;
            filledCells.push({x: cx, y: cy});
            // check top
            newCellsToCheckX.push(cx);
            newCellsToCheckY.push(cy - 1);
            // check right
            newCellsToCheckX.push(cx + 1);
            newCellsToCheckY.push(cy);
            // check bottom
            newCellsToCheckX.push(cx);
            newCellsToCheckY.push(cy + 1);
            // check left
            newCellsToCheckX.push(cx - 1);
            newCellsToCheckY.push(cy);
          }
        }
      }

      cellsToCheckX = newCellsToCheckX;
      cellsToCheckY = newCellsToCheckY;
    }

    return filledCells;
  }

  public static calculateFreeAroundRadius(x: number, y: number, pattern: number[][], bypass: Bypass): number {
    let n = pattern.length;
    let m = pattern[0].length;
    let bPoint: FreeAroundPoint;
    let cx: number, cy: number;
    let checkCollision = (x: number, y: number) => {
      return (x < 0 || y < 0 || x >= n || y >= m) || (pattern[x][y] !== 0)
    };

    for (let i=0, l=bypass.length; i < l; i++) {
      bPoint = bypass.points[i];
      cx = x + bPoint.x;
      cy = y + bPoint.y;

      if (checkCollision(cx, cy)) {
        let nearestPoint = bPoint;
        // check other point with same radius
        for (let j = i + 1; j < l; j++) {
          bPoint = bypass.points[j];
          if (bPoint.radius === nearestPoint.radius) {
            cx = x + bPoint.x;
            cy = y + bPoint.y;
            if (checkCollision(cx, cy)) {
              if (bPoint.distance < nearestPoint.distance) {
                nearestPoint = bPoint;
              }
            }
          } else {
            return nearestPoint.distance;
          }
        }
      }
    }
    return 0;
  }

  public static generateBypass(pattern: number[][]): Bypass {
    return new Bypass(Math.max(pattern.length, pattern[0].length));
  }

  public static collectFreeAroundPositions(pattern: number[][], bypass: Bypass): DistancePoint[] {
    let n = pattern.length;
    let m = pattern[0].length;
    let freeAroundPositions: DistancePoint[] = [];
    let removedAroundPositions: DistancePoint[] = [];

    // calculate radius for all free points
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        if (pattern[i][j] === 0) {
          let distance = PatternHelper.calculateFreeAroundRadius(i, j, pattern, bypass);
          // filter small free areas
          if (distance > 1) {
            freeAroundPositions.push(new DistancePoint(i, j, distance));
          }
        }
      }
    }

    // biggest radius first
    freeAroundPositions.sort((a, b) => (b.distance - a.distance));

    // eat smaller points
    let p1: DistancePoint, p2: DistancePoint;
    let distanceTillCollision, dx, dy, distanceBetweenPoints;
    for (let i = 0, l = freeAroundPositions.length; i < l; i++) {
      if (freeAroundPositions[i]) {
        p1 = freeAroundPositions[i];
        distanceTillCollision = p1.distance;

        for (let j = i + 1; j < l; j++) {
          if (freeAroundPositions[j]) {
            p2 = freeAroundPositions[j];
            dx = p2.x - p1.x;
            dy = p2.y - p1.y;
            distanceBetweenPoints = Math.sqrt(dx * dx + dy * dy);
            if (distanceBetweenPoints < distanceTillCollision) {
              // eat it
              removedAroundPositions[j] = p2;
              freeAroundPositions[j] = null;
            }
          }
        }
      }
    }

    // clear position list
    let positions = [];
    let point: DistancePoint;
    for (let i = 0, l = freeAroundPositions.length; i < l; i++) {
      point = freeAroundPositions[i];
      if (point) {
        positions.push(point);
      }
    }

    return positions;
  }

  // return sorted by size list of open areas
  public static findOpenAreas(pattern: number[][]): Point[][] {
    let n = pattern.length;
    let m = pattern[0].length;
    let openAreas = [];
    let checkedPattern = PatternHelper.createFilled(n, m, 0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        if (checkedPattern[i][j] === 0 && pattern[i][j] === 0) {
          let area = PatternHelper.floodFill(pattern, i, j, checkedPattern);
          openAreas.push(area);
        }
      }
    }

    // sort by size
    openAreas.sort((a, b) => (b.length - a.length));

    return openAreas;
  }

  // leave only biggest one on arg: pattern
  // returns list of open area cells
  public static removeSmallOpenAreas(pattern: number[][]): {x: number, y:number}[] {
    let openAreas = PatternHelper.findOpenAreas(pattern);

    if (openAreas.length === 0) {
      return null;
    }

    if (openAreas.length > 1) {
      // remove open areas
      openAreas
        // except biggest area
        .slice(1)
        .forEach((cells) => {
          cells.forEach((pos) => {
            pattern[pos.x][pos.y] = 1;
          });
        });
    }

    return openAreas[0];
  }

  public static calculateRectBlocks(pattern: number[][], combineValue: number): RectArea[] {
    let n = pattern.length;
    let m = pattern[0].length;
    let map = this.clone(pattern);
    let biggestRects: RectArea[] = [];

    let fillRect = (map: number[][], rectArea: RectArea): void => {
      for (let i=rectArea.x, il=rectArea.x + rectArea.w; i < il; i++) {
        for (let j=rectArea.y, jl=rectArea.y + rectArea.h; j < jl; j++) {
          // set just not same value to mark it as used
          map[i][j] = combineValue + 1;
        }
      }
    };

    let calculateBiggestSide = (map: number[][], x: number, y: number): number => {
      let cx: number;
      let cy: number;
      for (let sideLength=1; sideLength < n; sideLength++) {
        // TODO: think about get rid of double checking of the last cell on the last loop iteration
        for (let i=0; i <= sideLength; i++) {
          // next row
          cx = x + sideLength;
          cy = y + i;
          if ((cx >= n || cy >= m) || (map[cx][cy] !== combineValue)) {
            return sideLength;
          }
          // next col
          cx = x + i;
          cy = y + sideLength;
          if ((cx >= n || cy >= m) || (map[cx][cy] !== combineValue)) {
            return sideLength;
          }
        }
      }
      return 1;
    };

    // collect big rects
    // started from biggest
    let iterationCount = 0;
    while(iterationCount++ < 1000) {
      let bigX: number = 0;
      let bigY: number = 0;
      let bigR: number = 0;
      let currR: number = 0;

      // find biggest rect area
      for (let i=0; i < n; i++) {
        for (let j=0; j < m; j++) {
          if (map[i][j] === combineValue) {
            currR = calculateBiggestSide(map, i, j);
            if (currR > bigR) {
              bigX = i;
              bigY = j;
              bigR = currR;
            }
          }
        }
      }
      if (bigR > 1) {
        // add rects bigger than 1 cell
        let rect = new RectArea(biggestRects.length, bigX, bigY, bigR, bigR);
        fillRect(map, rect);
        biggestRects.push(rect);
      } else {
        // stop if biggest = 1 cell
        // to skip small (performance++)
        break;
      }
    }

    // create 1 cell rects (that were skipped)
    for (let i=0; i < n; i++) {
      for (let j=0; j < m; j++) {
        if (map[i][j] === combineValue) {
          biggestRects.push(new RectArea(biggestRects.length, i, j, 1, 1));
        }
      }
    }

    return biggestRects;
  }

  public static clone(pattern: number[][]): number[][] {
    return pattern.map(col => (col.map(cell => (cell))));
  }

  public static stringify(pattern: number[][], notParsable?:boolean): string {
    let transposedPattern = pattern[0].map(function(col, i) {
      return pattern.map(function(row) {
        return row[i];
      });
    });
    if (notParsable) {
      return transposedPattern
        .map(row => {
          return row.map(cell => {
            if (cell === 0) {
              return '-';
            }
            if (cell === 1) {
              return '+';
            }
            return Math.abs(cell);
          });
        })
        .map(col => (col.join(''))).join('\n')
          .replace(/\-/g, '░')
          .replace(/\+/g, '█');
    }
    return transposedPattern.map(col => (col.join(''))).join('\n')
            .replace(/0/g, '░')
            .replace(/1/g, '█');
  }

  public static parse(text: string): number[][] {
    let rows = text.split('\n');
    if (!rows.length || !rows[0] || !rows[0].length) {
      return null;
    }

    let n = rows[0].length;
    let m = rows.length;
    let pattern = PatternHelper.createFilled(n, m, 0);
    rows.forEach((rows, j) => {
      rows.split('').forEach((val, i) => {
        let cellValue: number;
        if (val === '░') cellValue = 0;
        else if (val === '█') cellValue = 1;
        else cellValue = parseInt(val, 10);

        pattern[i][j] = cellValue;
      });
    });

    return pattern;
  }
}

export = PatternHelper;
