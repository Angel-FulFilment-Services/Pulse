| Agent | Quantity |
|:------|:--------:|
@foreach ($table as $item)
| {{ $item['name'] }} | {{ $item['qty'] }} |
@endforeach