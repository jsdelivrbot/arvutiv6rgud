DROP TABLE IF EXISTS stats;
CREATE TABLE stats (
    mod_ts        bigserial,
    mod_hash      varchar(32),
	PRIMARY KEY(mod_ts, mod_hash)
);

CREATE OR REPLACE FUNCTION drop_all_records() RETURNS TRIGGER AS $$
    BEGIN
        DELETE FROM stats;
        RETURN NULL;
    END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS keep_one_row ON stats;
CREATE TRIGGER keep_one_row BEFORE INSERT ON stats EXECUTE PROCEDURE drop_all_records();

INSERT INTO stats (mod_ts, mod_hash) VALUES (1496428187000, 'fd11ce004f12238ca9f44d3aa49b977f');