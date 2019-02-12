-- Up
CREATE TABLE servers (name TEXT UNIQUE, key TEXT, host TEXT, port INTEGER, username TEXT);
CREATE TABLE files (server_id INTEGER, path TEXT, sudo INTEGER, CONSTRAINT unique_server_path UNIQUE (server_id, path));

-- Down
DROP TABLE files;
DROP TABLE servers;