#!/bin/sh
# Idempotens: új volume-on az entrypoint futtatja, meglévő környezetben kézzel is futtatható
# (docker compose exec mysql sh /docker-entrypoint-initdb.d/01-testing-db.sh).
# Az entrypoint source-olja, ezért exit helyett if.
# Az értékek SQL-literálba kerülnek, ezért escape-elve; üres érték esetén nem fut (anonim felhasználó ellen).
_test_db=$(printf '%s' "$MYSQL_DATABASE" | sed -e 's/`/``/g')
_test_user=$(printf '%s' "$MYSQL_TEST_USER" | sed -e 's/\\/\\\\/g' -e "s/'/''/g")
_test_pw=$(printf '%s' "$MYSQL_TEST_PASSWORD" | sed -e 's/\\/\\\\/g' -e "s/'/''/g")
if [ -z "$_test_db" ] || [ -z "$_test_user" ] || [ -z "$_test_pw" ]; then
    echo "01-testing-db.sh: MYSQL_DATABASE, MYSQL_TEST_USER és MYSQL_TEST_PASSWORD kötelező" >&2
    unset _test_db _test_user _test_pw
    false
else
    MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --protocol=socket -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`${_test_db}_testing\`;
CREATE USER IF NOT EXISTS '${_test_user}'@'%' IDENTIFIED BY '${_test_pw}';
ALTER USER '${_test_user}'@'%' IDENTIFIED BY '${_test_pw}';
GRANT ALL PRIVILEGES ON \`${_test_db}_testing\`.* TO '${_test_user}'@'%';
SQL
    _rc=$?
    unset _test_db _test_user _test_pw
    [ "$_rc" -eq 0 ]
fi
