import ms from 'ms';

export const getMS = (x: string | number): number => {
  if (typeof x === 'number') return x
  if (typeof x === 'string') return ms(x) || ms('28 days')
  throw new Error(`Undefined: ${x}`)
}