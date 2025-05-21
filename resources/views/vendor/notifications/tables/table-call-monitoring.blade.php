| Call No.| Call Description|
|:--------|:---------------:|
@foreach ($table as $i => $item)
| {{ $i }} | {{ $item['description'] }}
@endforeach
