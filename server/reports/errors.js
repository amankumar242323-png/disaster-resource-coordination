
function problem(status, code, title, detail, errors) {
  const body = {
    type: `/errors/${code}`,
    title,
    status,
    detail,
  };

  if (Array.isArray(errors) && errors.length > 0) {
    body.errors = errors.map(([field, message]) => ({
      field,
      message,
    }));
  }

  return {
    status,
    body,
  };
}

module.exports = { problem };
