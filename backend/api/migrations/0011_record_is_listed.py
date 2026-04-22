from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0010_actor_import_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="record",
            name="is_listed",
            field=models.BooleanField(default=True),
        ),
        migrations.AddIndex(
            model_name="record",
            index=models.Index(fields=["is_listed"], name="api_record_is_listed_idx"),
        ),
    ]
