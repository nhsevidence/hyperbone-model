describe("Hyperbone model", function(){

	describe("Initialisation", function(){

		it("can require the hyperbone module", function(){

			var Model = require('hyperbone-model').Model;

			expect( Model ).to.be.ok;
			expect( new Model({ _links: { self : { href : "/test"}}}) ).to.be.ok;
			expect( new Model({}) ).to.be.ok;

		});

	});

	describe("Attribute setting and getting", function(){
		// built into hyperbone is the automatic nesting of objects and arrays of objects

		var Model = require('hyperbone-model').Model;

		it("does the usual backbone shit with bog standard attributes", function(){

			var m = new Model({ _links : { self : { href : "/test"}}, name : "lol", description : "test"});

			expect( m.get("name") ).to.equal("lol");
			expect( m.get("description") ).to.equal("test");

		});

		it("turns objects into models", function(){

			var m = new Model( useFixture('/attribute-test') );

			expect( m.get("anObject").get("name") ).to.equal("name inside an object");
			expect( m.get("anObject").get("description") ).to.equal("description inside an object");
			expect( function(){m.get("anObject").url()} ).to.throw("Not a hypermedia resource");

		});		

		it("triggers correct change events when child model changed", function( done ){

			var m = new Model( useFixture('/attribute-test') );

			m.on("change:anObject", function(){

				expect( m.get("anObject").get("name") ).to.equal("lol I changed the name");

				done();

			});

			m.get("anObject").set("name", "lol I changed the name");

		});

		it("turns objects into specific models", function(){

			var Test = Model.extend({ defaults : { lol : "rofl"} });

			var EmbedTest = Model.extend({ _prototypes : { "test" : Test }});

			var m = new EmbedTest({ "test" : { rofl : "lol"}, _links : { self : { href : "/test"}}});

			expect( m.get("test").get("lol") ).to.equal("rofl");

		});


		it("turns arrays of objects into collections", function(){

			var m = new Model( useFixture('/attribute-test') );

			expect( m.get("anArrayofObjects").length ).to.equal(3);
			expect( m.get("anArrayofObjects").at(0).get("name") ).to.equal("obj 1");
			expect( function(){ m.get("anArrayofObjects").at(0).url()} ).to.throw("Not a hypermedia resource");

		});

		it("triggers the correct change events when a model in a collection is changed", function( done ){

			var m = new Model( useFixture('/attribute-test') );

			var o = m.get("anArrayofObjects");

			m.on("change:anArrayofObjects", function(){

				expect( m.get("anArrayofObjects").at(0).get("name") ).to.equal("lol I changed the name");
				done();

			});

			o.at(0).set("name", "lol I changed the name");

		});

		it("can return a nested attribute through dot notation", function(){

			var m = new Model( useFixture('/attribute-test') );

			expect( m.get("anObject.name") ).to.equal("name inside an object");

		});

		it("can return a model at an index in a collection through [0] notation", function(){

			var m = new Model( useFixture('/attribute-test') );

			expect( m.get("anArrayofObjects[0]").get("name") ).to.equal("obj 1");

			expect( m.get("anArrayofObjects[0].name") ).to.equal("obj 1");

		});

		it("can deal with dot notation to access deeply nested models attributes", function(){

			var m = new Model({
				foo : {
					bar : {
						kbo : {
							lol : "rofl!"
						}
					}					
				}				
			});

			expect( m.get("foo.bar.kbo.lol") ).to.equal("rofl!");

		});

		it("can deal with dot notation to set deeply nested models attributes", function(){

			var m = new Model({
				foo : {
					bar : {
						kbo : {
							lol : "rofl!"
						}
					}					
				}				
			});

			m.set("foo.bar.kbo.lol", "hello");

			// by default this creates a new attribute called 'foo.bar.kbo.lol' 
			// so to test this we need to access it via chaining to make sure
			// the correct object has been set
			expect( m.get("foo.bar.kbo").get("lol") ).to.equal("hello");

		});


		it("can deal with dot and [n] notation to access deeply nested models attributes", function(){

			var m = new Model({
				foo : {
					bar : [
						{
							kbo : {
								lol : "rofl!"
							}
						},
						{
							kbo : {
								lol : "haha!"
							},
						},
						{
							kbo : {
								lol : "chuckles"
							}
						}
					]
				}
			});

			expect( m.get("foo.bar[1].kbo.lol") ).to.equal("haha!");
			expect( m.get("foo.bar[2].kbo").get('lol') ).to.equal("chuckles");

		});

		it("It updates nested models, not overwriting, allowing events to be triggered", function(done){

			var m = new Model({
				foo : {
					bar : {
						kbo : "lol"
					}					
				}				
			});

			m.get("foo.bar").on("change:kbo", function(){

				expect( m.get("foo.bar.kbo") ).to.equal("rofl");

				done();

			});

			m.set({ foo : { bar : { kbo : "rofl"}}});

		});

		it("It updates models inside nested collections, not overwriting, allowing events to be triggered", function(done){

			var m = new Model({
				foo : [
					{
						bar : {
							kbo : "lol"
						}	
					},
					{
						bar : {
							kbo : "haha"							
						}						
					}
				]						
			});

			m.get("foo[0].bar").on("change:kbo", function(){

				expect( m.get("foo[0].bar.kbo") ).to.equal("rofl");

				done();

			});

			m.set({ foo : [ { bar : { kbo : "rofl"} } , { bar : { kbo : "chuckles"} } ] });

		});

		it("Doesn't traverse into models, just copies a reference", function(){

			var m = new Model({
				foo : {
					bar : {
						kbo : "lol"
					}					
				}				
			});

			var b = new Model({
				cake : {
					lie : "true"
				}								
			});

			expect( m.set("sub", { el : "hello",  }) ).to.be.ok;

		});

		it("allows traversing into objects to be disabled with options.", function(){

			var m = new Model({});

			var body = document.getElementsByTagName('body')[0];

			m.set("body", body, { noTraverse : true});

			expect( m.get("body") ).to.equal(body);

		});

	});

	describe("To JSON", function(){

		var Model = require('hyperbone-model').Model;

		it("Successfully serialises itself back to JSON", function(){

			var m = new Model({
				_links : {
					self : {
						href : '/tojson.test'
					}
				},
				_embedded : {
					"thing" : {
						name : "A thing",
						description: "Hello"
					}
				},
				stuff : [
					{
						name : "hi",
						value : 1234
					},
					{
						name : "howdy",
						value : 4352
					}
				],
				test : "Hello",
				lol : {
					brand : "google",
					app : "mail"
				}
			})

			var json = m.toJSON();

			expect(m.toJSON()).to.deep.equal({
				thing : {
					name : "A thing",
					description : "Hello"
				},
				stuff : [
					{
						name : "hi",
						value : 1234
					},
					{
						name : "howdy",
						value : 4352
					}
				],
				test : "Hello",
				lol : {
					brand : "google",
					app : "mail"
				}
			})

		})


	})

	describe("Embedding", function(){

		var Model = require('hyperbone-model').Model;

		it("turns a single embedded object into an attribute", function(){

			var m = new Model( useFixture('/embed-test') );

			expect( m.get("single-item").url() ).to.equal("/single-item");
			expect( m.get("single-item").get("name") ).to.equal("single item");

		});

		it("turns an array of embedded objects into a collection of models", function(){

			var m = new Model( useFixture('/embed-test') );

			expect( m.get("multiple-items").length ).to.equal(3)

		});

		it("Allows use of non-default model for embedded models", function(){

			var Test = Model.extend({ defaults : { lol : "rofl"} });

			var EmbedTest = Model.extend({ _prototypes : { "test" : Test }});

			var m = new EmbedTest({
				_links : {
					self : {
						href : "/test"
					}
				},
				_embedded : {
					"test" : {
						rofl : "lol"
					}
				}
			});

			expect( m.get("test").get("lol") ).to.equal("rofl");
			expect( m.get("test").get("rofl") ).to.equal("lol");

		});

		it("can dynamically create a collection with a pre-defined model from embeddeds", function(){

			var Test = Model.extend({ defaults : { lol : "rofl"} });

			var EmbedTest = Model.extend({ _prototypes : { "tests" : Test }});

			var m = new EmbedTest({
				_links : {
					self : {
						href : "/tests"
					}
				},
				_embedded : {
					"tests" : [
						{
							rofl : "lmao"
						},
						{
							rofl : "lulz"
						},
						{
							rofl : "hehe"
						}
					]
				}
			});

			expect( m.get("tests").at(0).get("lol") ).to.equal("rofl");
			expect( m.get("tests").at(1).get("lol") ).to.equal("rofl");
			expect( m.get("tests").at(2).get("lol") ).to.equal("rofl");

			expect( m.get("tests").at(0).get("rofl") ).to.equal("lmao");
			expect( m.get("tests").at(1).get("rofl") ).to.equal("lulz");
			expect( m.get("tests").at(2).get("rofl") ).to.equal("hehe");


		})

	});

	describe("Link handling", function(){

		var Model = require('hyperbone-model').Model;

		it("can set and get the correct self href", function(){

			var m = new Model({ _links : { self : { href : "/test" }} });

			expect( m.url() ).to.equal("/test");
			expect( m.rel("self") ).to.equal("/test");

		});

		it("can set and get other rels", function(){

			var m = new Model( useFixture('/services_curie') );

			expect( m.rel("app:test") ).to.equal("/services/test");

		});

		it("returns all rels for self discovery purposes", function(){

			var m = new Model( useFixture('/services_curie') );

			var rels = m.rels();

			expect( rels.self.href ).to.equal("/services");
			expect( rels.curie.href ).to.equal("/services/rels/{rel}");

		});

		it("can deal with uri templates", function(){

			var m = new Model( useFixture('/services_curie') );

			expect( function(){ m.rel("app:thing" ) } ).to.throw("No data provided to expand templated uri");
			expect( m.rel("app:thing", { id: "lol" }) ).to.equal("/services/thing/lol");

		});

		it("can handle arrays of links", function(){

			var m = new Model({ _links : {
					self : {
						href : "/test"
					},
					others : [
						{
							href : "/one"
						},
						{
							href : "/two"
						},
						{
							href : "/three"
						}
					]
				}
			});

			expect( m.rel('others').length ).to.equal(3);
			expect( m.rel('others')[1].href ).to.equal('/two');

		})

		it("automatically collapses arrays of one", function(){

			var m = new Model({ _links : {
					self : {
						href : "/test"
					},
					others : [
						{
							href : "/one"
						}
					]
				}
			});

			expect( m.rel('others') ).to.equal('/one');

		});

		it("can understand curie", function(){

			var m = new Model( useFixture('/services_curie') );

			m.rel("app:test").should.equal("/services/test");
			m.rel("app:helloworld").should.equal("/services/helloworld");

			m.fullyQualifiedRel("app:test").should.equal("/services/rels/test");
			m.fullyQualifiedRel("app:helloworld").should.equal("/services/rels/helloworld");

		});

		it("can understand curies", function(){

			var m = new Model( useFixture('/services_curies') );

			m.rel("app:test").should.equal("/services/test");
			m.rel("app:helloworld").should.equal("/services/helloworld");

			m.fullyQualifiedRel("app:test").should.equal("/services/rels/test");
			m.fullyQualifiedRel("app:helloworld").should.equal("/services/rels/helloworld");

		});


	});

	describe("Commands", function(){

		var Model = require('hyperbone-model').Model;

		it("does not add _commands as attributes - reserved property", function(){

			var m = new Model( useFixture('/tasklist') );

			expect( m.get("_commands") ).to.not.be.ok;

		});

		it("returns a command via a rel", function(){

			var m = new Model( useFixture('/tasklist') );

			expect( m.command("cmds:create-new") ).to.be.ok;
			expect( m.get("task[0]").command("cmds:complete") ).to.be.ok;

		});

		it("supports commands nested at the root of _commands", function(){

			var m = new Model({
				_links : {
					"cmds:test" : {
						href : "#_commands/edit"
					}
				},
				_commands: {
					edit : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default"
							}
					}
				}

			});

			expect( m.command("cmds:test").get("href") ).to.equal("/create");

		});

		it("supports deeply nested commands", function(){

			var m = new Model({
				_links : {
					"cmds:test" : {
						href : "#_commands/edit/test/indirection"
					}
				},
				_commands : {
					edit : {
						test : {
							indirection : {
								href: "/create",
								method : "POST",
								encoding : "application/x-www-form-urlencoded",
								properties : {
									name : "Default",
									description : "Default"

								}
							}
						}
					}
				}

			}); 

			expect( m.command("cmds:test").get("href") ).to.equal("/create");

		});

		it("returns supports multiple rel conventions", function(){

			// not entirely sure what the spec is here. Personally believe that 
			// internal rels should use a hash symbol, as it's a fragment.

			var m = new Model({
				_links : {
					"cmds:one" : {
						href : "#_commands/edit/create"
					},
					"cmds:two" : {
						href : "#commands/edit/create"
					},
					"cmds:three" : {
						href : "#command/edit/create"
					}
				},
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default"

							}
						}

					}
				}

			});

			expect( m.command("cmds:one").get("href") ).to.equal("/create");

			expect( m.command("cmds:two").get("href") ).to.equal("/create");

			expect( m.command("cmds:two").get("href") ).to.equal("/create");

		});

		it("returns a command via a direct reference", function(){

			var m = new Model( useFixture('/tasklist') );

			expect( m.command("edit.create-task") ).to.be.ok;
			expect( m.get("task[0]").command("edit.edit-task") ).to.be.ok;

		});

		it("Exposes a properties method for acessing the properties directly", function(){

			var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					}
				},
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						}

					}
				}

			});

			var properties = m.command('cmds:two').properties();

			expect(properties.get('name')).to.equal('Default');

		});

		it("can pull data from the parent model", function(){

			var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					}
				},
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						}

					}
				}

			});	

			var cmd = m.command('cmds:two');
			var properties = cmd.properties();

			cmd.pull();

			expect(properties.get('name')).to.equal('Not default');
			expect(properties.get('description')).to.equal('Not default description');
			expect(properties.get('bugger')).to.equal(null);

		});

		it("can push data to the parent model", function(){

				var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					}
				},
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						}

					}
				}

			});	

			var cmd = m.command('cmds:two');
			var properties = cmd.properties();

			cmd.push();

			expect(m.get('name')).to.equal('Default');
			expect(m.get('description')).to.equal('Default description');
			expect(m.get('bugger')).to.equal('this');		

		});

		it('can push data to another command', function(){

			var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					},
					"cmds:one" : {
						href : "#_commands/edit/other-create"
					}
				},
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						},
						"other-create" : {
							href : "/other-create",
							method : "PUT",
							properties : {
								name : "Something else",
								description : "Flip and blast!",
								randomness : "Hello!"
							}
						}

					}
				}

			});

			m.command('cmds:one').pushTo( m.command('cmds:two') );

			var props = m.command('cmds:two').properties();

			expect( props.get('name') ).to.equal('Something else');
			expect( props.get('description') ).to.equal('Flip and blast!');
			expect( props.get('randomness') ).to.equal(null);

		});

		it("can pull data from another command", function(){

			var m = new Model({
				_links : {
					"cmds:two" : {
						href : "#_commands/edit/create"
					},
					"cmds:one" : {
						href : "#_commands/edit/other-create"
					}
				},
				name : "Not default",
				description : "Not default description",
				bugger : 'this',
				_commands : {
					edit : {
						create : {
							href: "/create",
							method : "POST",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								name : "Default",
								description : "Default description"
							}
						},
						"other-create" : {
							href : "/other-create",
							method : "PUT",
							properties : {
								name : "Something else",
								description : "Flip and blast!",
								randomness : "Hello!"
							}
						}

					}
				}

			});

			m.command('cmds:two').pullFrom( m.command('cmds:one') );

			var props = m.command('cmds:two').properties();

			expect( props.get('name') ).to.equal('Something else');
			expect( props.get('description') ).to.equal('Flip and blast!');
			expect( props.get('randomness') ).to.equal(null);

		})

	})

});