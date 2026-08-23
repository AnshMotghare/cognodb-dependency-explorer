// Central error handler. Every route funnels its errors here so the
// frontend always gets a clean, predictable JSON error shape — never a
// raw stack trace. This is what powers the UI's error states.

export function errorHandler(err, req, res, next) {
  console.error(err);

  const isDbUnreachable =
    err.code === 'ServiceUnavailable' || /connection/i.test(err.message || '');

  res.status(isDbUnreachable ? 503 : 500).json({
    error: isDbUnreachable
      ? 'The database is temporarily unreachable. Please try again shortly.'
      : 'Something went wrong on our end.',
  });
}
