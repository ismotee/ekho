from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0009_alter_recordimage_context"),
    ]

    operations = [
        migrations.AddField(
            model_name="actor",
            name="import_id",
            field=models.UUIDField(blank=True, db_index=True, null=True, unique=True),
        ),
    ]
