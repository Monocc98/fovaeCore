// src/helpers/normalizeId.ts
type AnyObj = Record<string, any>;

type NormalizeOptions = {
  /** Si true, borra _id cuando hay id (o cuando se promueve). Default: true */
  removeUnderscore?: boolean;
  /** Si true, crea id = "" cuando no hay id ni _id. Default: false */
  addWhenMissing?: boolean;
};

const isPlainObject = (v: any): v is AnyObj =>
  v !== null && typeof v === "object" && !Array.isArray(v);

export const normalizeIdDeep = <T>(input: T, opts: NormalizeOptions = {}): T => {
  const { removeUnderscore = true, addWhenMissing = false } = opts;

  if (Array.isArray(input)) {
    return input.map((x) => normalizeIdDeep(x, opts)) as any;
  }

  if (!isPlainObject(input)) {
    return input;
  }

  const obj = { ...input } as AnyObj;

  const hasId = Object.prototype.hasOwnProperty.call(obj, "id");
  const hasUnderscoreId = Object.prototype.hasOwnProperty.call(obj, "_id");

  // 1) Promueve _id -> id SOLO si _id existe y id NO existe
  if (!hasId && hasUnderscoreId) {
    obj.id = String(obj._id); // asegúrate de string
    if (removeUnderscore) delete obj._id;
  }

  // 2) Si ya hay id y quieres ocultar _id duplicado, elimínalo
  if (hasId && hasUnderscoreId && removeUnderscore) {
    delete obj._id;
  }

  // 3) Si no hay ninguno y no quieres inventar id, NO hagas nada
  if (!hasId && !hasUnderscoreId && addWhenMissing) {
    obj.id = "";
  }

  // 4) Recorre propiedades anidadas
  for (const k of Object.keys(obj)) {
    obj[k] = normalizeIdDeep(obj[k], opts);
  }

  return obj as T;
};
