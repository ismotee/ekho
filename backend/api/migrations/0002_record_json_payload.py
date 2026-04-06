# Generated manually for record domain JSON payload (record-models.md).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(model_name="record", name="title"),
        migrations.RemoveField(model_name="record", name="artist"),
        migrations.RemoveField(model_name="record", name="year"),
        migrations.RemoveField(model_name="record", name="medium"),
        migrations.RemoveField(model_name="record", name="dimensions"),
        migrations.RemoveField(model_name="record", name="description"),
        migrations.RemoveField(model_name="record", name="condition"),
        migrations.RemoveField(model_name="record", name="image"),
        migrations.AddField(
            model_name="record",
            name="data",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="record",
            name="representative_image",
            field=models.ImageField(
                blank=True,
                max_length=255,
                null=True,
                upload_to="records/",
            ),
        ),
    ]
