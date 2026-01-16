<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;
use Illuminate\Auth\AuthenticationException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $exception)
    {       

        if ($exception instanceof AuthenticationException) {
            // Redirect unauthenticated users to the login page
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : parent::render($request, $exception);
        }

        if (
            $request->expectsJson() ||
            !$request->isMethod('GET') ||
            !app()->environment(['production', 'staging'])
        ) {
            return parent::render($request, $exception);
        }

        $status = $this->isHttpException($exception)
            ? $exception->getStatusCode()
            : 500;

        if (in_array($status, [500, 503, 404, 403, 419, 410])) {
            return Inertia::render('Errors/ErrorPage', ['status' => $status])
                ->toResponse($request)
                ->setStatusCode($status);
        } elseif ($status === 419) {
            return redirect()->back()->with([
                'message' => 'The page expired, please try again.',
            ]);
        }

        return parent::render($request, $exception);
    }
}
