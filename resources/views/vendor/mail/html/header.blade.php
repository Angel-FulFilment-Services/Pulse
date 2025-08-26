@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) == 'Pulse - Angel Fulfilment Services')
<img src="data:image/webp;base64,{{ base64_encode(file_get_contents(public_path('images/hero-large.webp'))) }}" height="75" class="logo" alt="Pulse">
@else
{{ $slot }}
@endif
</a>
</td>
</tr>
