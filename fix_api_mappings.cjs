const fs = require('fs');
let content = fs.readFileSync('api/src/index.ts', 'utf8');

content = content.replace(
  /settings: \{\s*festivalStatus: inMemoryAdminSettings\.festival_status,\s*registrationsOpen: inMemoryAdminSettings\.registrations_open,\s*coordinatorAssignments: inMemoryAdminSettings\.coordinator_assignments,\s*houseOfTheDay: inMemoryAdminSettings\.house_of_the_day,?\s*\}/g,
  `settings: {
            festivalStatus: inMemoryAdminSettings.festival_status,
            registrationsOpen: inMemoryAdminSettings.registrations_open,
            coordinatorAssignments: inMemoryAdminSettings.coordinator_assignments,
            houseOfTheDay: inMemoryAdminSettings.house_of_the_day,
            culturalsTitle: inMemoryAdminSettings.culturals_title,
            culturalsArtistRevealed: inMemoryAdminSettings.culturals_artist_revealed,
            culturalsArtists: inMemoryAdminSettings.culturals_artists,
          }`
);

content = content.replace(
  /settings: \{\s*festivalStatus: data\?\.festival_status \?\? DEFAULT_ADMIN_SETTINGS\.festival_status,\s*registrationsOpen: data\?\.registrations_open \?\? DEFAULT_ADMIN_SETTINGS\.registrations_open,\s*coordinatorAssignments: data\?\.coordinator_assignments \|\| DEFAULT_ADMIN_SETTINGS\.coordinator_assignments,\s*houseOfTheDay: data\?\.house_of_the_day \|\| DEFAULT_ADMIN_SETTINGS\.house_of_the_day,?\s*\}/g,
  `settings: {
        festivalStatus: data?.festival_status ?? DEFAULT_ADMIN_SETTINGS.festival_status,
        registrationsOpen: data?.registrations_open ?? DEFAULT_ADMIN_SETTINGS.registrations_open,
        coordinatorAssignments: data?.coordinator_assignments || DEFAULT_ADMIN_SETTINGS.coordinator_assignments,
        houseOfTheDay: data?.house_of_the_day || DEFAULT_ADMIN_SETTINGS.house_of_the_day,
        culturalsTitle: data?.culturals_title || DEFAULT_ADMIN_SETTINGS.culturals_title,
        culturalsArtistRevealed: data?.culturals_artist_revealed ?? DEFAULT_ADMIN_SETTINGS.culturals_artist_revealed,
        culturalsArtists: data?.culturals_artists || DEFAULT_ADMIN_SETTINGS.culturals_artists,
      }`
);

content = content.replace(
  /settings: \{\s*festivalStatus: data\?\.festival_status,\s*registrationsOpen: data\?\.registrations_open,\s*coordinatorAssignments: data\?\.coordinator_assignments \|\| \{\},\s*houseOfTheDay: data\?\.house_of_the_day \|\| '',?\s*\}/g,
  `settings: {
        festivalStatus: data?.festival_status,
        registrationsOpen: data?.registrations_open,
        coordinatorAssignments: data?.coordinator_assignments || {},
        houseOfTheDay: data?.house_of_the_day || '',
        culturalsTitle: data?.culturals_title || '',
        culturalsArtistRevealed: data?.culturals_artist_revealed ?? false,
        culturalsArtists: data?.culturals_artists || [],
      }`
);

content = content.replace(
  /\.select\('festival_status,registrations_open,coordinator_assignments,house_of_the_day'\)/g,
  `.select('festival_status,registrations_open,coordinator_assignments,house_of_the_day,culturals_title,culturals_artist_revealed,culturals_artists')`
);

content = content.replace(
  /inMemoryAdminSettings = \{\s*festival_status: festivalStatus,\s*registrations_open: registrationsOpen,\s*coordinator_assignments: coordinatorAssignments \|\| \{\},\s*house_of_the_day: houseOfTheDay \|\| '',?\s*\}/g,
  `inMemoryAdminSettings = {
          festival_status: festivalStatus,
          registrations_open: registrationsOpen,
          coordinator_assignments: coordinatorAssignments || {},
          house_of_the_day: houseOfTheDay || '',
          culturals_title: culturalsTitle || '',
          culturals_artist_revealed: culturalsArtistRevealed ?? false,
          culturals_artists: culturalsArtists || [],
        }`
);

fs.writeFileSync('api/src/index.ts', content);
