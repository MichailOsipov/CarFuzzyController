const normalizeValue = value => Math.min(1, Math.max(0, value));

const velocitySmall = velocity => normalizeValue(1 - (velocity / 25));
const velocityBig = velocity => normalizeValue((velocity / 25) - 1);

const distanceSmall = distance => normalizeValue(1 - (distance / 1000));
const distanceBig = distance => normalizeValue((distance / 1000) - 1);


const energySmall = energy => normalizeValue(1 - (energy / 250));
const energyAverage = energy => energy >= 250
    ? normalizeValue((375 - energy) / 125)
    : normalizeValue((energy / 125) - 1);

const energyBig = energy => normalizeValue((energy / 250) - 1);

const summ = values => values.reduce((sum, curr) => sum + curr, 0);

const createFuzzyController = ({rules, possibleValues}) => (...args) => {
    const POSSIBLE_VALUES_PARTS = 5;
    const implications = rules.map(({ifRules, thenRule}) => {
        const ifRuleValue = Math.min(...ifRules.map((ifRule, i) => ifRule(args[i])));
        return x => Math.min(ifRuleValue, thenRule(x));
    });
    const accumulation = y => Math.max(...implications.map(implication => implication(y)));

    const {from, to} = possibleValues;
    const shiftValue = (to - from) / POSSIBLE_VALUES_PARTS;
    const concretePossibleValues = Array(POSSIBLE_VALUES_PARTS + 1).fill(0).map((x, i) => from + shiftValue * i);

    const chisl = summ(concretePossibleValues.map(value => value * accumulation(value)));
    const znam = summ(concretePossibleValues.map(value => accumulation(value)));
    return chisl / znam;
};

const startCarMovementModel = ({
    startVelocity,
    startDistance,
    carMass,
    fuzzyController
}) => {
    let velocity = startVelocity;
    let distance = startDistance;
    let energy = carMass * Math.pow(startVelocity, 2) / 2;
    let fuzzyEnergy = 0;

    while(true) {
        const carStopped = velocity <= 0;
        const carCrushed = distance < 0;

        if (carStopped || carCrushed) {
            break;
        }

        fuzzyEnergy = fuzzyController(velocity, distance);

        console.log('fuzzyEnergy', fuzzyEnergy);
        console.log('velocity', velocity);
        console.log('distance', distance);
        energy -= fuzzyEnergy;
        energy = Math.max(0, energy);
        distance -= velocity;
        velocity = Math.pow(2 * energy / carMass, 0.5);
    }
};

const rules = [
    {
        ifRules: [velocitySmall, distanceSmall],
        thenRule: energySmall
    },
    {
        ifRules: [velocitySmall, distanceBig],
        thenRule: energyAverage
    },
    {
        ifRules: [velocityBig, distanceSmall],
        thenRule: energyAverage
    },
    {
        ifRules: [velocityBig, distanceBig],
        thenRule: energyBig
    }
];

const possibleValues = {from: 0, to : 500};

startCarMovementModel({
    startVelocity: 50,
    startDistance: 2000,
    carMass: 2,
    fuzzyController: createFuzzyController({rules, possibleValues})
});
