@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) == 'Pulse - Angel Fulfilment Services' || strpos($slot, 'pulse.angelfs.co.uk') !== false)
<div style="text-align: center; width: 100%;">
<img src="{{ asset('images/hero-large.webp') }}" height="75" class="logo" alt="Pulse" style="display: block; margin: 0 auto; max-width: 100%;">
</div>
@else
{{ $slot }}
@endif
</a>
</td>
</tr>
