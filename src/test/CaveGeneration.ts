/// <reference path='../../typings/chai.d.ts' />

import Randomizer = require('../utils/Randomizer');
import CaveGenerator = require('../map/CaveGenerator');
import MapHelper = require('../map/MapHelper');

declare var describe: Function, it: Function;
var assert = chai.assert;

const SHOULD_MAP =
`111111111111111111111111111···11
···111·111111111111111········11
···11··11111111··111··········11
·······111111·····11····11····11
1······111111··········1111··111
11·····11111111·········1111·111
11·······111111111·····111111111
11·······11····111···11111111111
11······1·······111·111111111111
1······11·····1··111···1111··111
1·····111····111·11····111····11
1····11······1111·····1111·····1
11···1··············11111······1
111·11··············11··········
1··111··························
····11················11········
···········111········111···11··
··········11111·······1111··11··
··········11111111····11·······1
··········11111111············11
··········1··1111············111
·········11··1111···1·······1111
1········11···11111111······1111
·········11····1111111·····11111
···················11·····111111
················11······11111111
1·········11···111······11111111
1········1111111111······1111111
1·······11111111111······1111111
11······11111···111·····11111111
11···11··1111···111·····11111111
111·1111·11111111111···111111111`;

const GENERATOR_OPTIONS = {
  n: 32,
  m: 32,
  nextReal: Randomizer.generateNextRealFunction(13),
  birthLimit: 4,
  deathLimit: 3,
};

describe("CaveGenerator", function() {
  it("generates random cave map", function() {
    let map = CaveGenerator.generate(GENERATOR_OPTIONS);
    assert.equal(MapHelper.mapToString(map), SHOULD_MAP);
  });
});