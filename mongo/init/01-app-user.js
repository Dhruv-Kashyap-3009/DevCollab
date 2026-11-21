// Runs once, on the very first start of an empty /data/db volume.
// The root user is created by the mongo image itself from
// MONGO_INITDB_ROOT_USERNAME / MONGO_INITDB_ROOT_PASSWORD; this script only
// adds the least-privilege application user the backend connects with.
//
// If the data volume already exists from before authentication was enabled,
// these scripts are NOT re-run: recreate the volume with
//   docker compose down -v
// or create the user manually (see README, "MongoDB authentication").

const appDb = process.env.MONGO_INITDB_DATABASE || 'devcollab';
const appUser = process.env.MONGO_APP_USER || 'devcollab';
const appPassword = process.env.MONGO_APP_PASSWORD;

if (!appPassword) {
  throw new Error('MONGO_APP_PASSWORD is required to create the application user');
}

const targetDb = db.getSiblingDB(appDb);

if (targetDb.getUser(appUser)) {
  print(`User "${appUser}" already exists on "${appDb}", skipping`);
} else {
  targetDb.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [{ role: 'readWrite', db: appDb }],
  });
  print(`Created user "${appUser}" with readWrite on "${appDb}"`);
}
