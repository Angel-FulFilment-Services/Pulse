<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\HR\Employee;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Defines the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            //
            'auth.user' => fn () => $request->user()
                ? $request->user()->only('id', 'name', 'profile_photo')
                : null,
            'employee' => fn () => $request->user()
                ? Employee::where('user_id', $request->user()->id)->first()->only('complete', 'hr_id', 'profile_photo', 'job_title')
                : null,
            'permissions' => fn () => $request->user()
                ? $request->user()->assignedPermissions()->pluck('right')
                : null,
        ]);
    }
}
