| DDI | Client | Wings Campaign | Wings Creative | Wings Direction |
|:--- |:------:|:--------------:|:--------------:|:---------------:|
@foreach ($table as $item)
| {{ $item['ddi'] }} | {{ $item['clientname'] }} | {{ $item['wings_camp'] }} | {{ $item['wings_crea'] }} | {{ $item['wings_dir'] }} |
@endforeach