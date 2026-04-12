# Generated manually for unique stable_id backfill

import uuid

from django.db import migrations, models


def forwards(apps, schema_editor):
    Collection = apps.get_model("api", "Collection")
    SystemIdentity = apps.get_model("api", "SystemIdentity")
    sid = SystemIdentity.objects.first()
    if not sid:
        sid = SystemIdentity.objects.create(instance_id=uuid.uuid4())
    iid = sid.instance_id
    for c in Collection.objects.all():
        if c.stable_id is None:
            c.stable_id = uuid.uuid4()
        if c.origin_ekho_instance_id is None:
            c.origin_ekho_instance_id = iid
        c.save(update_fields=["stable_id", "origin_ekho_instance_id"])


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_actor"),
    ]

    operations = [
        migrations.CreateModel(
            name="SystemIdentity",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("instance_id", models.UUIDField(default=uuid.uuid4, unique=True)),
            ],
            options={
                "verbose_name_plural": "System identity",
            },
        ),
        migrations.AddField(
            model_name="collection",
            name="stable_id",
            field=models.UUIDField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="collection",
            name="origin_ekho_instance_id",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="collection",
            name="is_listed",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="record",
            name="imported_first",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="record",
            name="imported_last",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name="collection",
            name="stable_id",
            field=models.UUIDField(default=uuid.uuid4, unique=True),
        ),
        migrations.AddIndex(
            model_name="collection",
            index=models.Index(fields=["is_listed"], name="api_collect_is_list_7a8b9c_idx"),
        ),
    ]
