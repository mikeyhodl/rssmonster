// Plain patterns retain their whitespace and anchors; /pattern/flags enables explicit flags.
export const compileActionRegex = expression => {
  const literal = expression.match(/^\/([\s\S]*)\/([a-z]*)$/i);
  return literal ? new RegExp(literal[1], literal[2]) : new RegExp(expression);
};
