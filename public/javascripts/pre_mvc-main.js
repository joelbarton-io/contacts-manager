// Model
class ContactModel {
  constructor() {
    this.contactsArray = [];
    this.contactsMap = new Map();
    this.tagsSet = new Set();
    this.selectedTagsSet = new Set();
  }

  async fetchContacts() {
    const url = "/api/contacts";
    const method = "get";
    const headers = { "Content-Type": "application/json" };
    const res = await fetch(url, { method, headers });
    return res.json();
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

  filterBySearch(event) {
    const filtered = this.contactsArray.filter((contact) =>
      contact.full_name.toLowerCase().includes(event.target.value.toLowerCase())
    );
    return filtered;
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

    return filtered;
  }
}

// View
class ContactView {
  constructor() {
    this.registerPartials();
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

  repopulateContactsView(contacts) {
    $("#contacts-view").empty();

    contacts.forEach((contact) => {
      let renderedContactHTML = ContactView.render(
        "contact-view-template-partial",
        contact
      );
      $("#contacts-view").append(renderedContactHTML);
    });
  }

  setupMenuView() {
    const menuViewHTML = ContactView.render("menu-view-template");
    $("body").prepend($("<main/>"));
    $("main").append(menuViewHTML);
  }

  setupTagsView(tags) {
    const tagsViewHTML = ContactView.render("tags-view-template", {
      tags: tags,
    });
    $("main").append(tagsViewHTML);
  }

  setupContactsView(contacts) {
    const context = {
      arrayOfContacts: contacts,
    };
    const contactsViewHTML = ContactView.render(
      "contacts-view-template",
      context
    );

    $("main").append(contactsViewHTML);
  }

  setupModalView() {
    const modalViewHTML = ContactView.render("modal-view-template");
    $("body").append(modalViewHTML);
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

// Controller
class ContactController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.init();
  }

  async init() {
    this.model.contactsArray = await this.model.fetchContacts();
    this.model.contactsMap = this.model.makeContactsMap(
      this.model.contactsArray
    );
    this.model.tagsSet = this.model.makeTagsSet(this.model.contactsArray);
    this.view.setupMenuView();
    this.view.setupTagsView([...this.model.tagsSet.values()]);
    this.view.setupContactsView([...this.model.contactsMap.values()]);
    this.view.setupModalView();

    $(window).on("click", (e) => {
      if (e.target === $("#modal-view")[0]) {
        this.view.closeModalView();
      }
    });

    $("#dynamic-search-contacts").on("input", (e) => {
      const filtered = this.model.filterBySearch(e);
      this.view.repopulateContactsView(filtered);
    });

    $("#tags-view").on("click", ".tag-element", (e) => {
      this.model.selectTag(e);
      const filtered = this.model.filterContactsByTag();
      this.view.repopulateContactsView(filtered);
    });

    // Add event listener for contact cards
    $("#contacts-view").on("click", ".contact-card", (event) => {
      this.view.openModalView();
      const contactCard = $(event.target).closest(".contact-card");
      const id = contactCard.data("id");
      const contact = this.model.contactsMap.get(id);
      this.view.setupModalView(contact);
    });
  }
}

// Usage
$(() => {
  const model = new ContactModel();
  const view = new ContactView();
  const controller = new ContactController(model, view);
});
