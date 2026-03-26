import {
  IServiceCallParameter,
  PARAM_TARGET_PATH,
  PARAM_TARGET_QUERY,
  PathSegment,
} from '@virtualservice/shared/model';

export const parameterCode = (target: string, name: string) => `${target}-${name}`;

export const getPathSegments = (path: string): PathSegment[] => {
  let target = PARAM_TARGET_PATH;
  return path
    .replace(/\{(.*?)}/g, (m) => `|${m}|`)
    .split('|')
    .map((text: string) => {
      if (/\?/g.test(text)) target = PARAM_TARGET_QUERY;
      const isParameter = /\{(.*?)}/g.test(text);
      const name = isParameter ? text.substring(1, text.length - 1) : text;
      const parameter = isParameter
        ? <IServiceCallParameter>{
            code: parameterCode(target, name),
            name,
            target,
          }
        : undefined;
      return <PathSegment>{ text, parameter };
    });
};

export const calcParameters = (path: string): IServiceCallParameter[] => {
  const pos = path.indexOf('?');
  const params: IServiceCallParameter[] = [];
  const rgx = /\{(.*?)}/gm;
  let m;

  while ((m = rgx.exec(path)) !== null) {
    if (m.index === rgx.lastIndex) {
      rgx.lastIndex++;
    }
    const target = m.index < pos ? PARAM_TARGET_PATH : PARAM_TARGET_QUERY;
    params.push(<IServiceCallParameter>{
      code: `${target}-${m[1]}`,
      name: m[1],
      target,
    });
  }
  return params;
};
