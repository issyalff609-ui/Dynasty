export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const pickOne = <T,>(items: T[]) => items[randomInt(0, items.length - 1)];

export const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export const pickUpToTwo = <T,>(items: T[], allowZero: boolean) => {
  const roll = Math.random();
  let count = 1;

  if (allowZero && roll < 0.05) {
    count = 0;
  } else if (roll < 0.55) {
    count = 1;
  } else {
    count = 2;
  }

  return shuffle(items).slice(0, count);
};

export const weightedPick = <T,>(items: { value: T; weight: number }[]) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
};
