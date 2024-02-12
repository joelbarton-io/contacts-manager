class App {
  async initialize() {
    this.contactsArray = await this.fetchContacts();
    this.contactsMap = this.createContactsMapFromList(this.contactsArray);
    this.tagsSet = this.createTagsSetFromContacts(this.contactsArray);
    this.selectedTagsSet = new Set();
    this.registerPartials();
    this.setupMenuView();
    this.setupTagsView();
    this.setupContactsView();
    this.setupModalView();
  }

  // <---------------------Model--------------------->
  async fetchContacts() {
    try {
      const response = await fetch("/api/contacts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("There was a problem with fetching contacts: ", error);
    }
  }

  async createContact(e) {
    e.preventDefault();

    const form = e.target;
    const url = form.getAttribute("action");
    const method = form.getAttribute("method");
    const headers = { "Content-Type": "application/json" };
    const body = this.processNewContactToJSON(form);

    try {
      const res = await fetch(url, { method, headers, body });
      if (res.ok) {
        const newContact = await res.json();
        this.contactsMap.set(newContact.id, newContact);
        this.contactsArray = [...this.contactsMap.values()];
        this.refreshViews();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async updateContact(e) {
    e.preventDefault();
    const form = e.target;
    const url = form.getAttribute("action");
    const method = form.getAttribute("method");
    const headers = { "Content-Type": "application/json" };
    const body = this.processExistingContactToJSON(form);

    try {
      const res = await fetch(url, { method, headers, body });
      if (res.status === 201) {
        const updatedContact = await res.json();
        this.contactsMap.set(updatedContact.id, updatedContact);
        this.contactsArray = [...this.contactsMap.values()];
        this.refreshViews();

        $("#update-contact-view").empty();
      }
    } catch (error) {
      console.log(error);
    }
  }

  async deleteContact(id) {
    const url = `/api/contacts/${id}`;
    const method = "DELETE";

    try {
      const res = await fetch(url, { method });
      if (res.status === 204) {
        this.contactsMap.delete(id);
        this.contactsArray = [...this.contactsMap.values()];
        this.refreshViews();
      }
    } catch (error) {
      console.log(`ERROR: ${error}`);
    }
  }

  createContactsMapFromList(arr) {
    return arr.reduce((contactMap, contact) => {
      if (!contactMap.has(contact.id)) {
        contactMap.set(contact.id, contact);
      }
      return contactMap;
    }, new Map());
  }

  createTagsSetFromContacts(arrayOfContacts) {
    return arrayOfContacts.reduce((set, { tags }) => {
      if (tags) tags.split(",").forEach((t) => set.add(t));
      return set;
    }, new Set());
  }

  makeContextObject(id, allTags = false) {
    const contact = this.contactsMap.get(id);
    const contactTags = contact.tags ? contact.tags.split(",") : [];
    const tags = allTags ? [...this.tagsSet.values()] : contactTags;
    return { contact, tags };
  }

  // <---------------------View--------------------->
  static render(scriptID, context) {
    return Handlebars.compile($(`#${scriptID}`).html()).call(null, context);
  }

  refreshViews() {
    $("#tags-view, #contacts-view").remove();
    this.setupTagsView();
    this.setupContactsView();
  }

  setupMenuView() {
    $("body").append($("<main/>"));
    $("main").append(App.render("menu-view-template"));

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
    $("main").append(
      App.render("tags-view-template", {
        tags: [...this.tagsSet.values()],
      })
    );
    $("#tags-view").on("click", ".tag-element", (e) => {
      this.selectTag(e);
      this.filterContactsByTag();
    });
  }

  setupContactsView() {
    $("main").append(
      App.render("contacts-view-template", {
        arrayOfContacts: [...this.contactsMap.values()],
      })
    );

    $("#contacts-view").on("click", ".contact-card", (event) => {
      this.openModalView();
      this.setupModalContactView.call(this, event);
    });
  }

  setupModalView() {
    $("body").append(App.render("modal-view-template"));
  }

  setupModalContactView(event) {
    const contactCard = $(event.target).closest(".contact-card");
    const id = contactCard.data("id");
    contactCard.toggleClass("active");

    const modalContactViewHTML = App.render(
      "modal-contact-view-template",
      this.makeContextObject(id, false)
    );

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
    $("#modal-update-contact-view").on("submit", (e) => {
      this.updateContact(e);
      this.closeModalView();
    });

    $("#back-button")[0].addEventListener("click", () => {
      $("#modal-update-contact-view").hide();
      $("#modal-contact-view").show();
    });
  }

  setupModalCreateContactView() {
    $("#modal-view").html(
      App.render("modal-create-contact-view-template", {
        tags: [...this.tagsSet.values()],
      })
    );
    $("#modal-create-contact-view").on("submit", (event) => {
      //   event.preventDefault();

      //   const name = $("#contact-full-name").val().trim();
      //   const phone = $("#contact-phone-number").val().trim();
      //   const email = $("#contact-email-address").val().trim();
      //   const tag = $("#contact-tag").val().trim();

      //   console.table({
      //     name,
      //     phone,
      //     email,
      //     tag,
      //   });

      //   let isValid = true;

      //   // Validate name
      //   if (name.trim() === "") {
      //     isValid = false;
      //     alert("Name cannot be empty");
      //   }

      //   // Validate phone
      //   if (!/^\d{10}$/.test(phone)) {
      //     isValid = false;
      //     alert("Phone number must be exactly 10 digits");
      //   }

      //   // Validate email
      //   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      //     isValid = false;
      //     alert("Invalid email address");
      //   }

      //   if (isValid) {
      //     form.submit();
      //   }
      this.createContact(event);
      this.closeModalView();
    });
    $('[name="discard-button"]').on("click", this.closeModalView);
  }

  setupModalCreateTagView() {
    $("#modal-view").html(App.render("modal-create-tag-view-template"));

    $("#create-tag-button").on("click", () => {
      const newTag = $("#new-tag").val().trim().toLowerCase();
      this.tagsSet.add(newTag);
      this.closeModalView();
    });

    $('[name="discard-button"]').on("click", () => this.closeModalView());
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

  // <--------------------Controller----------------------->
  processNewContactToJSON(form) {
    const fd = new FormData(form);
    const data = {};
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
        case "contact-tag":
          const t = $("#contact-tag").val();
          data.tags = t === "" ? null : t.val();
        default:
          break;
      }
    }
    if (!("tags" in data)) return JSON.stringify(data);
  }

  processExistingContactToJSON(form) {
    const id = $(form).data("contact-id");
    let currentTagsSet = new Set();
    let currentTags = this.contactsMap.get(id).tags;

    if (currentTags !== null) {
      [...currentTags.split(",")].forEach((existingTag) =>
        currentTagsSet.add(existingTag)
      );
    }

    const data = { id };
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
        case "contact-tag":
          const t = $("#contact-tag").val();
          if (t !== "") {
            currentTagsSet.add(t);
          }
          data.tags = [...currentTagsSet.values()].join(",");
        default:
          break;
      }
    }
    return JSON.stringify(data);
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

  repopulateContactsView(contacts) {
    $("#contacts-view").empty();

    contacts.forEach((contact) => {
      $("#contacts-view").append(
        App.render("contact-view-template-partial", contact)
      );
    });
  }

  filterBySearch(event) {
    const filtered = this.contactsArray.filter((contact) =>
      contact.full_name.toLowerCase().includes(event.target.value.toLowerCase())
    );
    this.repopulateContactsView(filtered);
  }

  filterContactsByTag() {
    let filtered;
    if (this.selectedTagsSet.size === 0) {
      filtered = this.contactsArray;
    } else {
      filtered = this.contactsArray.filter(({ tags }) => {
        if (tags) {
          const tagsArray = tags.split(",");
          return tagsArray.some((tag) => this.selectedTagsSet.has(tag));
        }
      });
    }

    this.repopulateContactsView(filtered);
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
}

$(() => {
  new App().initialize();
});
