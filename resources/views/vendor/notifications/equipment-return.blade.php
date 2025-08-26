@component('mail::message')

# Equipment Return Processed

An equipment return has been processed and requires your attention.

@component('mail::panel')
**Return Information**

**Kit:** {{ $kitData->alias }}  
**Returned By:** {{ $returnedToUser->firstname }} {{ $returnedToUser->surname }} (HR ID: {{ $returnedToUser->hr_id }})  
**Processed By:** {{ $processedByUser->firstname }} {{ $processedByUser->surname }}  
**Return Date:** {{ \Carbon\Carbon::parse($returnData->datetime)->format('d/m/Y H:i') }}  

@if($returnData->notes)
**Notes:** {{ $returnData->notes }}
@endif
@endcomponent

@if(count($returnItems) > 0)
## Returned Items

@component('mail::table')
| AFS ID | Alias | Type | Status |
|:-------|:------|:-----|:-------|
@foreach($returnItems as $item)
| {{ $item['afs_id'] ?: '' }} | {{ $item['alias'] ?: 'N/A' }} | {{ $item['type'] ?: 'N/A' }} | @if($item['status'] == 'functioning')<span style="color: #155724; background-color: #d4edda; padding: 2px 6px; border-radius: 3px; font-size: 12px;">{{ ucfirst(str_replace('_', ' ', $item['status'])) }}</span>@elseif($item['status'] == 'faulty')<span style="color: #856404; background-color: #fff3cd; padding: 2px 6px; border-radius: 3px; font-size: 12px;">{{ ucfirst(str_replace('_', ' ', $item['status'])) }}</span>@elseif($item['status'] == 'damaged')<span style="color: #721c24; background-color: #f8d7da; padding: 2px 6px; border-radius: 3px; font-size: 12px;">{{ ucfirst(str_replace('_', ' ', $item['status'])) }}</span>@else<span style="color: #383d41; background-color: #e2e3e5; padding: 2px 6px; border-radius: 3px; font-size: 12px;">{{ ucfirst(str_replace('_', ' ', $item['status'])) }}</span>@endif |
@endforeach
@endcomponent
@endif

@if(count($attachments) > 0)
## Attachments

The following files have been attached to this return:

@foreach($attachments as $attachment)
- {{ $attachment['original_name'] }}
@endforeach
@endif

Please review the returned equipment and take appropriate action.

@component('mail::subcopy')
This is an automated notification from the Asset Management System.
@endcomponent

@endcomponent
