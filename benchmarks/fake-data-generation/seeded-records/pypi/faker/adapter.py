from faker import Faker

def operation(input):
    fake = Faker()
    fake.seed_instance(input['seed'])
    return [
        {
            'name': fake.name(),
            'email': fake.email(),
            'street': fake.street_address(),
            'date': fake.date_between(start_date='-30y', end_date='today').isoformat(),
        }
        for _ in range(input['count'])
    ]
