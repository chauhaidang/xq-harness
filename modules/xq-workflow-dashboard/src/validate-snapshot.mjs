import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export async function validateDashboardSnapshot(snapshot) {
  const schema = JSON.parse(await readFile(new URL("../dashboard-data.schema.json", import.meta.url), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(snapshot)) {
    throw new TypeError(`Dashboard snapshot failed schema validation: ${ajv.errorsText(validate.errors)}`);
  }
}
