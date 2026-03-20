import pymysql
pymysql.version_info = (2, 2, 1, "final", 0)
pymysql.install_as_MySQLdb()

# Patch Django's MySQL version check to allow older MariaDB versions (like XAMPP's 10.4)
import django.db.backends.mysql.base as mysql_base
mysql_base.DatabaseWrapper.check_database_version_supported = lambda self: None

# Disable RETURNING clause because MariaDB < 10.5 doesn't support it
import django.db.backends.mysql.features as mysql_features
mysql_features.DatabaseFeatures.can_return_columns_from_insert = False



