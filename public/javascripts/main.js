class App {
  constructor() {}

  async init() {
    this.contactsArray = await this.fetchContacts();
    this.contactsMap = this.makeContactsMap(this.contactsArray);
    this.tagsSet = this.makeTagsSet(this.contactsArray);
    this.selectedTagsSet = new Set();

    this.registerPartials();
    this.setupMenuView();
    this.setupTagsView();
    this.setupContactsView();
    this.setupModalView();
  }

  async fetchContacts() {
    const url = "/api/contacts";
    const method = "get";
    const headers = { "Content-Type": "application/json" };
    const res = await fetch(url, { method, headers });
    return res.json();
  }

  static render(scriptID, context) {
    return Handlebars.compile($(`#${scriptID}`).html()).call(null, context);
  }

  registerPartials() {
    Handlebars.registerPartial(
      "contactPartial",
      $("#contact-view-template-partial").html()
    );

    Handlebars.registerPartial(
      "tagsPartial",
      $("#tags-view-partial-template").html()
    );
  }

  filterBySearch(event) {
    const filtered = this.contactsArray.filter((contact) =>
      contact.full_name.toLowerCase().includes(event.target.value.toLowerCase())
    );

    $("#contacts-view").empty();

    filtered.forEach((contact) => {
      let renderedContactHTML = Render.individualContact(contact);
      $("#contacts-view").append(renderedContactHTML);
    });
  }

  filterContactsByTag() {
    const list = $("#contacts-view");

    if (this.selectedTagsSet.size === 0) {
      const allContacts = this.contactsArray.map((contact) => {
        let renderedContactHTML = Render.individualContact(contact);
        return renderedContactHTML;
      });
      list.html(allContacts);
      return;
    }

    const filtered = this.contactsArray.filter(({ tags }) => {
      if (tags) {
        const tagsArray = tags.split(",");
        return tagsArray.some((tag) => this.selectedTagsSet.has(tag));
      }
    });

    list.empty();

    filtered.forEach((contact) => {
      let renderedContactHTML = Render.individualContact(contact);
      list.append(renderedContactHTML);
    });
  }

  makeContactsMap(arr) {
    return arr.reduce((contactMap, contact) => {
      if (!contactMap.has(contact.id)) {
        contactMap.set(contact.id, contact);
      }
      return contactMap;
    }, new Map());
  }

  makeTagsSet(arrayOfContacts) {
    return arrayOfContacts.reduce((set, { tags }) => {
      if (tags) tags.split(",").forEach((t) => set.add(t));
      return set;
    }, new Set());
  }

  selectTag(e) {
    $(e.target).toggleClass("selected");
    const tag = $(e.target).text();
    if (this.selectedTagsSet.has(tag)) {
      this.selectedTagsSet.delete(tag);
    } else {
      this.selectedTagsSet.add(tag);
    }
  }

  makeContextObject(id, allTags = false) {
    const contact = this.contactsMap.get(id);
    const contactTags = contact.tags ? contact.tags.split(",") : [];
    const tags = allTags ? [...this.tagsSet.values()] : contactTags;
    return { contact, tags };
  }

  setupMenuView() {
    const menuViewHTML = App.render("menu-view-template");
    $("body").prepend($("<main/>"));
    $("main").append(menuViewHTML);

    $(window).on("click", (e) => {
      if (e.target === $("#modal-view")[0]) {
        this.closeModalView();
      }
    });

    $("#dynamic-search-contacts").on("input", this.filterBySearch.bind(this));

    $("#new-contact-button").on("click", () => {
      this.openModalView();
      this.setupModalCreateContactView();
    });

    $("#new-tag-button").on("click", () => {
      this.openModalView();
      this.setupModalCreateTagView();
    });
  }

  setupTagsView() {
    const tagsViewHTML = App.render("tags-view-template", {
      tags: [...this.tagsSet.values()],
    });
    $("main").append(tagsViewHTML);
    $("#tags-view").on("click", ".tag-element", (e) => {
      this.selectTag(e);
      this.filterContactsByTag();
    });
  }

  setupContactsView() {
    const context = {
      arrayOfContacts: [...this.contactsMap.values()],
    };
    const contactsViewHTML = App.render("contacts-view-template", context);

    $("main").append(contactsViewHTML);

    $("#contacts-view").on("click", ".contact-card", (event) => {
      this.openModalView();
      this.setupModalContactView.call(this, event);
    });
  }

  setupModalView() {
    const modalViewHTML = App.render("modal-view-template");
    $("body").append(modalViewHTML);
  }

  setupModalContactView(event) {
    const contactCard = $(event.target).closest(".contact-card");
    const id = contactCard.data("id");
    contactCard.toggleClass("active");

    const modalContactViewHTML = App.render("modal-contact-view-template", {
      contact: this.contactsMap.get(id),
    });

    $("#modal-view").append(modalContactViewHTML);

    // this is ugly but it works
    $("#update-contact-button").on("click", () => {
      if ($("#modal-update-contact-view").length === 0) {
        $("#modal-contact-view").hide();
        this.setupModalUpdateContactView(id);
      } else {
        $("#modal-update-contact-view").show();
      }
    });

    $("#delete-contact-button").on("click", () => {
      this.deleteContact(id);
      this.closeModalView();
    });
  }

  setupModalUpdateContactView(id) {
    const modalUpdateContactViewHTML = App.render(
      "modal-update-contact-view-template",
      this.makeContextObject(id, true)
    );

    $("#modal-view").append(modalUpdateContactViewHTML);

    $("#back-button")[0].addEventListener("click", () => {
      $("#modal-update-contact-view").hide();
      $("#modal-contact-view").show();
    });
  }

  setupModalCreateContactView() {
    const createContactViewHTML = App.render(
      "modal-create-contact-view-template",
      {
        tags: [...this.tagsSet.values()],
      }
    );
    $("#modal-view").html(createContactViewHTML);
    $("#modal-create-contact-view").on("submit", ServerAction.createContact);
    $('[name="discard-button"]').on("click", this.closeModalView);
  }

  setupModalCreateTagView() {
    const createTagViewHTML = App.render("modal-create-tag-view-template");
    $("#modal-view").html(createTagViewHTML);

    $("#create-tag-button").on("click", () => {
      const newTag = $("#new-tag").val().trim();
      this.tagsSet.add(newTag);
      this.closeModalView();
    });
    $('[name="discard-button"]').on("click", this.closeModalView);
  }

  openModalView() {
    $("main").toggleClass("idle");
    $("#modal-view").css("display", "block");
  }

  closeModalView() {
    const modalView = $("#modal-view");
    modalView.empty();
    modalView.css("display", "none");
    modalView.toggleClass("active");
    $(`#contacts-view .active`).toggleClass("active");
    $("main").toggleClass("idle");
  }
}

/* pretty much no reason to use the Class syntax here besides visually looking better */
class ServerAction {
  static async createContact(e) {
    e.preventDefault();
    alert("submitted from create contact function");
    const form = e.target;
    const url = form.getAttribute("action");
    const method = form.getAttribute("method");
    const headers = { "Content-Type": "application/json" };
    const body = this.processFormToJSON(form);

    try {
      const res = await fetch(url, { method, headers, body });
      if (res.ok) {
        const newContact = await res.json();
        this.contactsMap.set(newContact.id, newContact);
        this.contactsArray = this.contactsMap.values();
      }
    } catch (error) {
      console.error(error);
    }
  }

  static async deleteContact(id) {
    const url = `/api/contacts/${id}`;
    const method = "DELETE";

    try {
      const res = await fetch(url, { method });
      if (res.status === 204) {
        this.contactsMap.delete(id);
        this.contactsArray = this.contactsMap.values();
      }
    } catch (error) {
      console.log(`ERROR: ${error}`);
    }
  }

  static async updateContact(e) {
    e.preventDefault();
    const form = e.target;
    const url = form.getAttribute("action");
    const method = form.getAttribute("method");
    const headers = { "Content-Type": "application/json" };
    const body = this.processEditFormToJSON(form);
    try {
      const res = await fetch(url, { method, headers, body });
      if (res.status === 201) {
        const updatedContact = await res.json();
        this.contactsMap.set(updatedContact.id, updatedContact);
        this.contactsArray = this.contactsMap.values();

        $("#update-contact-view").empty();
      }
    } catch (error) {
      console.log(error);
    }
  }

  // to do next
  static processEditFormToJSON(form) {
    const data = { id: $(form).data("contact-id") };
    const fd = new FormData(form);
    for (let [key, value] of fd.entries()) {
      switch (key) {
        case "contact-full-name":
          data.full_name = value;
          break;
        case "contact-email-address":
          data.email = value;
          break;
        case "contact-phone-number":
          data.phone_number = value;
          break;
        case "contact-tags":
          const selectElement = form.querySelector("#contact-tags");
          const selectedOptions = [...selectElement.selectedOptions]
            .map((option) => option.value)
            .join(",");
          data.tags = selectedOptions;
        default:
          break;
      }
    }
    if (!("tags" in data)) data.tags = null;
    return JSON.stringify(data);
  }

  static processFormToJSON(form) {
    const data = {};
    const fd = new FormData(form);
    for (let [key, value] of fd.entries()) {
      switch (key) {
        case "new-contact-full-name":
          data.full_name = value;
          break;
        case "new-contact-email-address":
          data.email = value;
          break;
        case "new-contact-phone-number":
          data.phone_number = value;
          break;
        case "new-contact-tags":
          const selectElement = form.querySelector("#new-contact-tags");
          const selectedOptions = Array.from(selectElement.selectedOptions)
            .map((option) => option.value)
            .join(",");
          data.tags = selectedOptions;
        default:
          break;
      }
    }
    if (!("tags" in data)) data.tags = null;
    return JSON.stringify(data);
  }
}

$(() => {
  let app = new App();
  app.init();
});
