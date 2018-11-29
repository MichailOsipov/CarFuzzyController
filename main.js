const normalizeValue = value => Math.min(1, Math.max(0, value));

const initEnergyRules = [
    {
        velocityType: 'low',
        distanceType: 'small',
        energy: 100
    },
    {
        velocityType: 'low',
        distanceType: 'average',
        energy: 100
    },
    {
        velocityType: 'low',
        distanceType: 'far',
        energy: 100
    },
    {
        velocityType: 'medium',
        distanceType: 'small',
        energy: 100
    },
    {
        velocityType: 'medium',
        distanceType: 'average',
        energy: 100
    },
    {
        velocityType: 'medium',
        distanceType: 'far',
        energy: 100
    },
    {
        velocityType: 'high',
        distanceType: 'small',
        energy: 100
    },
    {
        velocityType: 'high',
        distanceType: 'average',
        energy: 100
    },
    {
        velocityType: 'high',
        distanceType: 'far',
        energy: 100
    }
];

const lowVelocity = x => {
    if (x <= 0) {
        return 1;
    }
    if (x > 0 && x <= 15) {
        return 1 - x / 15;
    }
    return 0;
};
const mediumVelocity = x => {
    const a = 20;
    const b = 5;
    if (x >= a - b && x < a) {
        return 1 + (x - a) / b;
    }
    if (x >= a && x < a + b) {
        return 1 - (x - a) / b;
    }
    return 0;
};
const highVelocity = x => {
    if (x >= 30) {
        return 1;
    }
    if (x > 20 && x < 30) {
        return 1 + (x - 30) / 20;
    }
    return 0;
};

const velocityActivation = {
    low: lowVelocity,
    medium: mediumVelocity,
    high: highVelocity
};

const smallDistance = x => {
    if (x <= 0) {
        return 1;
    }

    if (x > 0 && x < 150) {
        return 1 - x / 150;
    }

    return 0;
};
const averageDistance = x => {
    const a = 400;
    const b = 250;
    if (x >= a - b && x < a) {
        return 1 + (x - a) / b;
    }
    if (x >= a && x < a + b) {
        return 1 - (x - a) / b;
    }
    return 0;
};
const farDistance = x => {
    if (x >= 800) {
        return 1;
    }

    if (x > 400 && x < 800) {
        return 1 + (x - 800) / 400;
    }
    return 0;
};

const distanceActivation = {
    small: smallDistance,
    average: averageDistance,
    far: farDistance
};

const calcActivation = ({velocityType, distanceType}, velocity, distance) => {
    return Math.min(
        velocityActivation[velocityType](velocity),
        distanceActivation[distanceType](distance)
    );
};

const fuzzyController = (velocity, distance, energiesRules) => {
    const activationsEnergies = energiesRules.map(energyRule => ({
        activation: calcActivation(energyRule, velocity, distance),
        energy: energyRule.energy
    }));
    const upperSum = activationsEnergies.reduce((sum, {activation, energy}) => sum + activation * energy, 0);
    const underSum = activationsEnergies.reduce((sum, {activation}) => sum + activation, 0);
    return upperSum / underSum;
};

const simulationCreator = ({
    startVelocity,
    startDistance,
    carMass,
    fuzzyController
}) => energiesRules => {
    const velocityChanges = [];
    const distanceChanges = [];
    const energyChanges = [];
    let velocity = startVelocity;
    let distance = startDistance;
    let energy = carMass * Math.pow(startVelocity, 2) / 2;
    let fuzzyEnergy = 0;
    let iterationNumber = 0;
    while (true) {
        const carStopped = velocity <= 0;
        const carCrushed = distance <= 0;
        energyChanges.push(fuzzyEnergy);
        velocityChanges.push(velocity);
        distanceChanges.push(distance);
        if (carStopped || carCrushed) {
            return {
                lastVelocity: velocity,
                lastDistance: distance,
                velocityChanges,
                distanceChanges,
                energyChanges
            };
        }
        fuzzyEnergy = fuzzyController(velocity, distance, energiesRules);
        energy -= fuzzyEnergy;
        energy = Math.max(0, energy);
        distance -= velocity;
        velocity = Math.pow(2 * energy / carMass, 0.5);
    }
}

const makeASimulation = simulationCreator({
    startVelocity: 25,
    startDistance: 1000,
    carMass: 1000,
    fuzzyController
});

const generateEnergyRules = maxEnergy => [
    {
        velocityType: 'low',
        distanceType: 'small',
        energy: 1 + Math.random() * maxEnergy
    },
    {
        velocityType: 'low',
        distanceType: 'average',
        energy: 1 + Math.random() * maxEnergy
    },
    {
        velocityType: 'low',
        distanceType: 'far',
        energy: 1 + Math.random() * maxEnergy
    },
    {
        velocityType: 'medium',
        distanceType: 'small',
        energy: 1 + Math.random() * maxEnergy
    },
    {
        velocityType: 'medium',
        distanceType: 'average',
        energy: 1 + Math.random() * maxEnergy
    },
    {
        velocityType: 'medium',
        distanceType: 'far',
        energy: 1 + Math.random() * maxEnergy
    },
    {
        velocityType: 'high',
        distanceType: 'small',
        energy: 1 + Math.random() * maxEnergy
    },
    {
        velocityType: 'high',
        distanceType: 'average',
        energy: 1 + Math.random() * maxEnergy
    },
    {
        velocityType: 'high',
        distanceType: 'far',
        energy: 1 + Math.random() * maxEnergy
    }
];

const createEnergyRulesPopulation = (maxEnergy, populationsCount) => {
    const populations = [];
    for (let i = 0; i < populationsCount; i++) {
        populations.push(generateEnergyRules(maxEnergy));
    }
    return populations;
};

const makeCrossover = (child1, child2) => {
    const min = 1;
    const max = child1.length - 2;
    const rand = Math.floor(Math.random() * (max - min) + 1) + min;
    const first = [...child1.slice(0, rand), ...child2.slice(rand, child2.length)];
    const second = [...child2.slice(0, rand), ...child1.slice(rand, child1.length)];
    return [first, second];
};

const makeMutation = (child) => {
    const min = 0;
    const max = child.length - 1;
    const rand = Math.floor(Math.random() * (max - min) + 1) + min;
    const newChild = [...child];
    const {velocityType, distanceType, energy} = newChild[rand];
    newChild[rand] = {
        velocityType,
        distanceType,
        energy: energy * 2
    };
    return newChild;
};

const mutate = (child) => {
    const MUTATION_PROBABILITY = 0.05;
    const rand = Math.random();
    if (rand < MUTATION_PROBABILITY) {
        return makeMutation(child);
    }
    return child;
};

const sortByMostValueble = energyRulesPopulation => {
    const energiesAndSimulationRes = energyRulesPopulation.map(energyRules => {
        const {lastDistance} = makeASimulation(energyRules);
        return {lastDistance, energyRules};
    });
    energiesAndSimulationRes.sort(({lastDistance: distance1}, {lastDistance: distance2}) => {
        if (distance1 < 0) {
            return 1;
        }
        if (distance2 < 0) {
            return -1;
        }
        return distance1 < distance2 ? -1 : 1;
    });
    return energiesAndSimulationRes.map(({energyRules}) => energyRules);
};

const updateEnergyRulesPopulation = energyRulesPopulation => {
    const pairs = [];
    const newEnergyRulesPopulation = [...energyRulesPopulation];
    for (let i = 0; i < energyRulesPopulation.length / 2; i++) {
        pairs[i] = [
            energyRulesPopulation[i * 2],
            energyRulesPopulation[i * 2 + 1]
        ];
    }
    pairs.forEach(pair => {
        const [child1, child2] = pair;
        const [child1Crossover, child2Crossover] = makeCrossover(child1, child2);
        const child1Mutate = mutate(child1Crossover);
        const child2Mutate = mutate(child2Crossover);
        newEnergyRulesPopulation.push(child1Mutate);
        newEnergyRulesPopulation.push(child2Mutate);
    });
    return sortByMostValueble(newEnergyRulesPopulation).slice(0, newEnergyRulesPopulation.length / 2);
};

const calculateEnergyRulesAndSimulate = (iterationsCount) => {
    const ACCEPTABLE_DISTANCE = 20;
    const MAX_ENERGY = 20000;
    const POPULATIONS_COUNT = 10;

    let energyRulesPopulation = createEnergyRulesPopulation(MAX_ENERGY, POPULATIONS_COUNT);
    let lastSimulationRes;

    for (let i = 0; i < iterationsCount; i++) {
        energyRulesPopulation = updateEnergyRulesPopulation(energyRulesPopulation);
        const bestEnergyRules = sortByMostValueble(energyRulesPopulation)[0];
        lastSimulationRes = makeASimulation(bestEnergyRules);
        if (lastSimulationRes.lastDistance < ACCEPTABLE_DISTANCE) {
            return lastSimulationRes;
        }
    }

    return lastSimulationRes;
};

const toPoints = yArray =>
    yArray.map((y, i) => [i, y]);
const {
    velocityChanges,
    distanceChanges,
    energyChanges
} = calculateEnergyRulesAndSimulate(500);

const [maxEnergy] = [...energyChanges].sort((x, y) => x > y ? -1 : 1);

functionPlot({
  target: '#velocityChange',
  data: [{
    points: toPoints(velocityChanges),
    fnType: 'points',
    graphType: 'polyline'
  }],
  yAxis: {domain: [0, 25]},
  xAxis: {domain: [0, velocityChanges.length]}
})
functionPlot({
  target: '#distanceChange',
  data: [{
    points: toPoints(distanceChanges),
    fnType: 'points',
    graphType: 'polyline'
  }],
  yAxis: {domain: [0, 1000]},
  xAxis: {domain: [0, distanceChanges.length]}
})
functionPlot({
  target: '#energyChange',
  data: [{
    points: toPoints(energyChanges),
    fnType: 'points',
    graphType: 'polyline'
  }],
  yAxis: {domain: [0, maxEnergy]},
  xAxis: {domain: [0, energyChanges.length]}
})
