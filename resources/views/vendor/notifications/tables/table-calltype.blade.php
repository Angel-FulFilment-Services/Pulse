| Client | Calltype |
|:-------|:--------:|
@foreach ($table as $item)
| {{ $item['clientname'] }} | {{ $item['calltype'] }}
@endforeach
