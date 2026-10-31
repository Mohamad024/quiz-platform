export const MIGRATIONS = [
  { version: 1, run: (data) => data },
];
export async function migrateStorage(data) {
  let result = data;
  for (const m of MIGRATIONS) result = m.run(result);
  return result;
}
