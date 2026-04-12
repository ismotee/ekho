# Generated manually — catalog organization for the collection

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_collection_responsible_department"),
    ]

    operations = [
        migrations.AddField(
            model_name="collection",
            name="owning_organization",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="owned_collections",
                to="api.actor",
            ),
        ),
    ]
