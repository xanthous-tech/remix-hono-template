export enum ProjectPackagesEnum {
  FLEX = 'FLEX',
  PRO = 'PRO',
  POWER = 'POWER',
}

export const STRIPE_PRICE_IDS = {
  development: {
    [ProjectPackagesEnum.FLEX]: 'price_',
    [ProjectPackagesEnum.PRO]: 'price_',
    [ProjectPackagesEnum.POWER]: 'price_',
  },
  production: {
    [ProjectPackagesEnum.FLEX]: 'price_',
    [ProjectPackagesEnum.PRO]: 'price_',
    [ProjectPackagesEnum.POWER]: 'price_',
  },
};

export const STRIPE_PRICE_IDS_LOOKUP = {
  development: Object.fromEntries(
    Object.keys(STRIPE_PRICE_IDS.development).map((key: any) => {
      return [STRIPE_PRICE_IDS.development[key as ProjectPackagesEnum], key];
    }),
  ),
  production: Object.fromEntries(
    Object.keys(STRIPE_PRICE_IDS.production).map((key: any) => {
      return [STRIPE_PRICE_IDS.production[key as ProjectPackagesEnum], key];
    }),
  ),
};
