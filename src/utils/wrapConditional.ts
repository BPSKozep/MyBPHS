export default function wrapConditional<ArgumentType>(
  fn: (arg: ArgumentType) => ArgumentType,
  arg: ArgumentType,
  enabled: boolean,
) {
  if (!enabled) return arg;

  return fn(arg);
}
