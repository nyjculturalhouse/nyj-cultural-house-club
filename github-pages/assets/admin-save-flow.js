(() => {
  const form = document.querySelector("#form");
  const draftButton = document.querySelector("#draft");
  const saveButton = [...(form?.querySelectorAll("button") || [])].find((button) => button.type === "submit");

  if (!form || !draftButton || !saveButton || !form.elements.isPublished) return;

  // 일반 저장은 공개 상태로, 임시저장은 비공개 상태로 명확히 구분합니다.
  saveButton.addEventListener("click", () => {
    form.elements.isPublished.value = "true";
  });

  draftButton.onclick = () => {
    form.elements.isPublished.value = "false";
    form.requestSubmit(saveButton);
  };
})();
