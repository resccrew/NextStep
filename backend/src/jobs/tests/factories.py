from hashlib import sha256

import factory
from jobs.models import Job, Company

class CompanyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Company

    name = factory.Sequence(lambda n: f"Company: {n}")

class JobFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Job

    title = "Python Developer"
    company = factory.SubFactory(CompanyFactory)
    original_url = factory.Sequence(lambda n: f"https://www.praca.pl/oferta_{n}.html")
    url_hash = factory.LazyAttribute(lambda o: sha256(o.original_url.encode()).hexdigest())