@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) == 'Pulse - Angel Fulfilment Services')
<img src="{{ asset('images/hero-large.webp') }}" height="75" class="logo" alt="Pulse" style="display: block; max-width: 100%;">
@else
{{ $slot }}
@endif
</a>
</td>
</tr>
