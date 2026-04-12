# Generated manually for collection-level responsible unit field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_rename_api_collect_is_list_7a8b9c_idx_api_collect_is_list_8f44be_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='collection',
            name='responsible_department',
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
