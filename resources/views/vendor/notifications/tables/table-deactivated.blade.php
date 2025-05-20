| Agent | Last Active |
|:------|:-----------:|
@foreach ($table as $item)
| {{ $item['name'] }} | {{ $item['last_active'] }} |
@endforeach