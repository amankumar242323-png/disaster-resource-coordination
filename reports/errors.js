
function problem(status, code, title, detail) {
  return {
    status,
    body: {
      type: `/errors/${code}`,
      title,
      status,
      detail,
    },
  };
}

module.exports = { problem };
