@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) == 'Pulse - Angel Fulfilment Services')
@php
    $imagePath = public_path('images/hero-large.webp');
    $imageExists = file_exists($imagePath);
    $imageData = $imageExists ? base64_encode(file_get_contents($imagePath)) : '';
@endphp
@if($imageExists && $imageData)
<img src="data:image/webp;base64,{{ $imageData }}" height="75" class="logo" alt="Pulse" style="display: block;">
@else
<span style="font-size: 18px; font-weight: bold; color: #333;">Pulse - Angel Fulfilment Services</span>
@endif
@else
{{ $slot }}
@endif
</a>
</td>
</tr>
