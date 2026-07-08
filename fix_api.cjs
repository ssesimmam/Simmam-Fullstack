const fs = require('fs');
let content = fs.readFileSync('api/src/index.ts', 'utf8');

content = content.replace(
  /const DEFAULT_ADMIN_SETTINGS = \{[\s\S]*?house_of_the_day: '',\n\}/,
  `const DEFAULT_ADMIN_SETTINGS = {
  festival_status: 'pre',
  registrations_open: true,
  coordinator_assignments: {},
  house_of_the_day: '',
  culturals_title: '',
  culturals_artist_revealed: false,
  culturals_artists: [],
}`
);

content = content.replace(
  /let inMemoryAdminSettings = \{[\s\S]*?house_of_the_day: '',\n\}/,
  `let inMemoryAdminSettings = {
  festival_status: 'pre',
  registrations_open: true,
  coordinator_assignments: {} as any,
  house_of_the_day: '',
  culturals_title: '',
  culturals_artist_revealed: false,
  culturals_artists: [] as any[],
}`
);

content = content.replace(
  /select\('festival_status,registrations_open,coordinator_assignments,house_of_the_day'\)/g,
  `select('festival_status,registrations_open,coordinator_assignments,house_of_the_day,culturals_title,culturals_artist_revealed,culturals_artists')`
);

content = content.replace(
  /settings: \{\n\s*festivalStatus: inMemoryAdminSettings\.festival_status,\n\s*registrationsOpen: inMemoryAdminSettings\.registrations_open,\n\s*coordinatorAssignments: inMemoryAdminSettings\.coordinator_assignments,\n\s*houseOfTheDay: inMemoryAdminSettings\.house_of_the_day,\n\s*\}/g,
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
  /settings: \{\n\s*festivalStatus: data\?\.festival_status[\s\S]*?houseOfTheDay: data\?\.house_of_the_day[\s\S]*?\}/g,
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
  /const \{ festivalStatus, registrationsOpen, coordinatorAssignments, houseOfTheDay \} = parsedBody\.data\n\n\s*const payload = \{[\s\S]*?house_of_the_day: houseOfTheDay \|\| '',\n\s*\}/,
  `const { festivalStatus, registrationsOpen, coordinatorAssignments, houseOfTheDay, culturalsTitle, culturalsArtistRevealed, culturalsArtists } = parsedBody.data

    const payload = {
      id: 'singleton',
      festival_status: festivalStatus,
      registrations_open: registrationsOpen,
      coordinator_assignments: coordinatorAssignments || {},
      house_of_the_day: houseOfTheDay || '',
      culturals_title: culturalsTitle || '',
      culturals_artist_revealed: culturalsArtistRevealed ?? false,
      culturals_artists: culturalsArtists || [],
    }`
);

content = content.replace(
  /inMemoryAdminSettings = \{\n\s*festival_status: festivalStatus,\n\s*registrations_open: registrationsOpen,\n\s*coordinator_assignments: coordinatorAssignments \|\| \{\},\n\s*house_of_the_day: houseOfTheDay \|\| '',\n\s*\}/g,
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
