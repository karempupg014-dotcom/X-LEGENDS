extends CharacterBody3D

signal health_changed(value: int)

@export var move_speed := 5.2
@export var max_health := 100
var health := 100
var move_input := Vector2.ZERO
var attack_cooldown := 0.0
var attack_requested := false
var camera_pivot: Node3D

func _ready() -> void:
    health = max_health
    _build_character()

func _build_character() -> void:
    var collider := CollisionShape3D.new()
    var capsule := CapsuleShape3D.new()
    capsule.radius = 0.42
    capsule.height = 1.7
    collider.shape = capsule
    collider.position.y = 0.85
    add_child(collider)

    var body := MeshInstance3D.new()
    var mesh := CapsuleMesh.new()
    mesh.radius = 0.42
    mesh.height = 1.7
    body.mesh = mesh
    body.position.y = 0.85
    var material := StandardMaterial3D.new()
    material.albedo_color = Color(0.16, 0.38, 0.52)
    material.metallic = 0.12
    body.material_override = material
    add_child(body)
    var head := MeshInstance3D.new()
    var head_mesh := SphereMesh.new()
    head_mesh.radius = 0.25
    head_mesh.height = 0.5
    head.mesh = head_mesh
    head.position = Vector3(0, 1.72, 0)
    var skin := StandardMaterial3D.new()
    skin.albedo_color = Color(0.72, 0.56, 0.42)
    head.material_override = skin
    add_child(head)

func _physics_process(delta: float) -> void:
    attack_cooldown = maxf(0.0, attack_cooldown - delta)
    var keyboard := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction := move_input
    if keyboard.length() > 0.1:
        direction = keyboard
    var velocity_3d := Vector3(direction.x, 0.0, direction.y)
    if velocity_3d.length() > 1.0:
        velocity_3d = velocity_3d.normalized()
    velocity.x = velocity_3d.x * move_speed
    velocity.z = velocity_3d.z * move_speed
    velocity.y -= 22.0 * delta
    move_and_slide()
    if velocity_3d.length() > 0.1:
        rotation.y = atan2(-velocity_3d.x, -velocity_3d.z)

    if Input.is_action_just_pressed("attack") or attack_requested:
        attack_requested = false
        try_attack()

func try_attack() -> void:
    if attack_cooldown > 0.0:
        return
    attack_cooldown = 0.55
    var closest: Node3D
    var best_distance := 2.5
    for enemy in get_tree().get_nodes_in_group("zombies"):
        if not is_instance_valid(enemy):
            continue
        var distance := global_position.distance_to(enemy.global_position)
        if distance < best_distance:
            best_distance = distance
            closest = enemy
    if closest and closest.has_method("take_damage"):
        closest.take_damage(35)

func take_damage(amount: int) -> void:
    health = maxi(0, health - amount)
    health_changed.emit(health)
