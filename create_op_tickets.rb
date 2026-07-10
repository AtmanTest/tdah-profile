# tdah-profile v16 — Create EPIC + 6 US in OpenProject
p = Project.find(4)
puts "Project: #{p.name} (id=#{p.id})"

author = User.find_by(login: "admin") || User.first || User.new(login: "admin").tap{|u| u.save(validate: false)}
prio = IssuePriority.first || raise("No priorities found")
default_status = Status.find_by(name: "En cours") || Status.first
epic_type = Type.find_by(name: "EPIC") || Type.find(1)
us_type = Type.find_by(name: "User Story") || Type.find_by(position: 2) || Type.find(1)

WorkPackage.transaction do
  epic = WorkPackage.create(
    project: p,
    type: epic_type,
    author: author,
    subject: "v16 — 6 nouvelles features (dashboard, chat, PDF, planner, tracker, témoignages)",
    description: "Sprint v16 : implémentation des 6 améliorations proposées.\n\n1. Dashboard scores temps réel (radar chart)\n2. Chat TDAH assistant (DeepSeek API)\n3. PDF récapitulatif imprimable\n4. Planificateur rdv médicaux\n5. Suivi médicamenteux quotidien\n6. Témoignages anonymes / FAQ",
    status: default_status,
    priority: prio,
    done_ratio: 0
  )
  epic.save!
  puts "EPIC created: ##{epic.id} - #{epic.subject}"

  features = [
    "Dashboard scores en temps réel (radar + barres se mettant à jour en direct)",
    "Chat TDAH assistant (DeepSeek API, clé localStorage)",
    "PDF récapitulatif imprimable pour psychiatre",
    "Planificateur de rendez-vous médicaux (timeline + check-list)",
    "Suivi médicamenteux quotidien (tracker + graphique)",
    "Témoignages anonymes / FAQ communautaire"
  ]

  features.each do |subj|
    us = WorkPackage.create(
      project: p,
      type: us_type,
      author: author,
      subject: subj,
      status: default_status,
      priority: prio,
      parent: epic
    )
    us.save!
    puts "US created: ##{us.id} - #{us.subject}"
  end

  puts "\nDone: EPIC ##{epic.id} + #{features.size} US"
end
